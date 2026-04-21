"""
SafeSwipe - Flask Backend
Run: python app.py
"""


from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score,
    recall_score, f1_score, confusion_matrix
)
from imblearn.over_sampling import SMOTE
import joblib
import os
import json
import sqlite3
from datetime import datetime
import threading
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
import uuid


app = Flask(__name__)
CORS(app)

# ── Training Status Tracker ────────────────────────────────────────────────────
training_status = {
    "in_progress": False,
    "error": None,
    "metrics": None,
    "progress": "idle"
}
training_lock = threading.Lock()

# ── SQLite setup ──────────────────────────────────────────────────────────────────
DB_PATH = os.path.join("instance", "safeswipe.sqlite")
admin_sessions = {}  # token -> username

os.makedirs("instance", exist_ok=True)


def get_db_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_conn()
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS card_checks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            card_masked TEXT,
            network TEXT,
            valid BOOLEAN,
            luhn_check BOOLEAN,
            length_valid BOOLEAN,
            digit_count INTEGER,
            checked_at TEXT,
            admin_id INTEGER,
            FOREIGN KEY(admin_id) REFERENCES admins(id)
        )
    """)
    conn.commit()
    conn.close()


def _get_admin_by_username(username):
    conn = get_db_conn()
    c = conn.cursor()
    c.execute("SELECT * FROM admins WHERE username = ?", (username,))
    row = c.fetchone()
    conn.close()
    return row


def _create_admin(username, password_hash):
    conn = get_db_conn()
    c = conn.cursor()
    c.execute(
        "INSERT INTO admins(username, password_hash, created_at) VALUES (?, ?, ?)",
        (username, password_hash, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()

def _get_admin_id(username):
    conn = get_db_conn()
    c = conn.cursor()
    c.execute("SELECT id FROM admins WHERE username = ?", (username,))
    row = c.fetchone()
    conn.close()
    return row["id"] if row else None

def _record_card_check(card_masked, network, valid, luhn, length_valid, digit_count, username):
    admin_id = _get_admin_id(username)   

    conn = get_db_conn()
    c = conn.cursor()

    c.execute(
        """INSERT INTO card_checks
        (card_masked, network, valid, luhn_check, length_valid, digit_count, checked_at, admin_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (card_masked, network, int(valid), int(luhn), int(length_valid), digit_count, datetime.now().isoformat(), admin_id)
    )

    conn.commit()
    conn.close()


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return jsonify({"error": "Authorization token required"}), 401
        token = auth.split(" ", 1)[1]
        if token not in admin_sessions:
            return jsonify({"error": "Invalid or expired token"}), 401
        return f(*args, **kwargs)
    return decorated

# ── Paths ──────────────────────────────────────────────────────────────────────
MODEL_DIR   = "models"
SCALER_PATH  = os.path.join(MODEL_DIR, "scaler.pkl")
LR_PATH      = os.path.join(MODEL_DIR, "logistic_regression.pkl")
DT_PATH      = os.path.join(MODEL_DIR, "decision_tree.pkl")
RF_PATH      = os.path.join(MODEL_DIR, "random_forest.pkl")
METRICS_PATH = os.path.join(MODEL_DIR, "metrics.json")
SAMPLES_PATH = os.path.join(MODEL_DIR, "sample_transactions.csv")
os.makedirs(MODEL_DIR, exist_ok=True)

FEATURE_COLS = [f"V{i}" for i in range(1, 29)] + ["Amount_scaled", "Time_scaled"]


# ── Luhn Algorithm ─────────────────────────────────────────────────────────────
def luhn_check(card_number: str) -> bool:
    digits = [int(d) for d in str(card_number) if d.isdigit()]
    if len(digits) < 13:
        return False
    total = 0
    is_even = False
    for d in reversed(digits):
        if is_even:
            d *= 2
            if d > 9:
                d -= 9
        total += d
        is_even = not is_even
    return total % 10 == 0


# ── Training Pipeline ──────────────────────────────────────────────────────────
def _normalize_dataframe_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [str(c).strip().replace('\ufeff', '') for c in df.columns]
    lower_to_col = {c.lower(): c for c in df.columns}

    # canonical names
    alias_map = {
        'class': 'Class',
        'time': 'Time',
        'amount': 'Amount',
    }
    for i in range(1, 29):
        alias_map[f'v{i}'] = f'V{i}'

    rename = {}
    for key, canon in alias_map.items():
        if canon not in df.columns and key in lower_to_col:
            rename[lower_to_col[key]] = canon

    if rename:
        df = df.rename(columns=rename)

    return df


def train_models(df: pd.DataFrame) -> dict:
    # df is already normalized in upload_dataset route
    df = df.drop_duplicates().reset_index(drop=True)

    # Validate required columns exist
    required = ["Time", "Amount", "Class"] + [f"V{i}" for i in range(1, 29)]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Missing columns after upload: {missing}")

    # Save 300 samples BEFORE scaling (mix of fraud and legit)
    fraud_rows  = df[df["Class"] == 1].sample(min(150, len(df[df["Class"] == 1])), random_state=42)
    legit_rows  = df[df["Class"] == 0].sample(min(150, len(df[df["Class"] == 0])), random_state=42)
    samples_raw = pd.concat([fraud_rows, legit_rows]).sample(frac=1, random_state=42)
    samples_raw.to_csv(SAMPLES_PATH, index=False)

    # Scale Amount and Time
    amount_scaler = StandardScaler()
    time_scaler   = StandardScaler()
    df["Amount_scaled"] = amount_scaler.fit_transform(df[["Amount"]])
    df["Time_scaled"]   = time_scaler.fit_transform(df[["Time"]])

    # Save a combined scaler object as dict
    joblib.dump({"amount": amount_scaler, "time": time_scaler}, SCALER_PATH)

    X = df[FEATURE_COLS].values
    y = df["Class"].values

    before_counts = dict(zip(*np.unique(y, return_counts=True)))
    if len(before_counts) != 2 or min(before_counts.values()) < 10:
        raise ValueError("Not enough class diversity after filtering; need at least 10 examples per class.")

    # SMOTE
    sm = SMOTE(random_state=42)
    X_res, y_res = sm.fit_resample(X, y)

    X_train, X_test, y_train, y_test = train_test_split(
        X_res, y_res, test_size=0.2, random_state=42, stratify=y_res
    )

    results = {}
    configs = {
        "logistic_regression": (LogisticRegression(max_iter=1000, C=1.0, random_state=42), LR_PATH),
        "decision_tree":       (DecisionTreeClassifier(max_depth=10, min_samples_split=10, random_state=42), DT_PATH),
        "random_forest":       (RandomForestClassifier(n_estimators=50, n_jobs=2, random_state=42), RF_PATH),
    }

    for name, (model, path) in configs.items():
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        joblib.dump(model, path)
        results[name] = {
            "accuracy":          round(float(accuracy_score(y_test, y_pred))  * 100, 2),
            "precision":         round(float(precision_score(y_test, y_pred)) * 100, 2),
            "recall":            round(float(recall_score(y_test, y_pred))    * 100, 2),
            "f1":                round(float(f1_score(y_test, y_pred))        * 100, 2),
            "confusion_matrix":  confusion_matrix(y_test, y_pred).tolist(),
        }

    metrics = {
        "models":                         results,
        "class_distribution_before_smote": {int(k): int(v) for k, v in before_counts.items()},
        "training_samples":               int(X_train.shape[0]),
        "test_samples":                   int(X_test.shape[0]),
        "trained_at":                     datetime.now().isoformat(),
    }
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)

    return metrics


def load_models():
    paths = [LR_PATH, DT_PATH, RF_PATH, SCALER_PATH]
    if not all(os.path.exists(p) for p in paths):
        return None
    scalers = joblib.load(SCALER_PATH)
    return {
        "logistic_regression": joblib.load(LR_PATH),
        "decision_tree":       joblib.load(DT_PATH),
        "random_forest":       joblib.load(RF_PATH),
        "amount_scaler":       scalers["amount"],
        "time_scaler":         scalers["time"],
    }


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.route("/admin-signup", methods=["POST"])
def admin_signup():
    data = request.json
    if not data or "username" not in data or "password" not in data:
        return jsonify({"error": "username and password required"}), 400
    username = data["username"].strip()
    pwd = data["password"]
    if not username or not pwd:
        return jsonify({"error": "Username and password must not be empty"}), 400

    existing = _get_admin_by_username(username)
    if existing is not None:
        return jsonify({"error": "Admin account already exists"}), 400

    _create_admin(username, generate_password_hash(pwd))
    return jsonify({"success": True, "message": "Admin account created"}), 201


@app.route("/admin-login", methods=["POST"])
def admin_login():
    data = request.json
    if not data or "username" not in data or "password" not in data:
        return jsonify({"error": "username and password required"}), 400
    username = data["username"].strip()
    pwd = data["password"]

    existing = _get_admin_by_username(username)
    if existing is None:
        return jsonify({"error": "No admin account configured"}), 404

    if not check_password_hash(existing["password_hash"], pwd):
        return jsonify({"error": "Invalid credentials"}), 401

    token = str(uuid.uuid4())
    admin_sessions[token] = username
    return jsonify({"success": True, "token": token, "username": username}), 200


@app.route("/admin-logout", methods=["POST"])
@admin_required
def admin_logout():
    auth = request.headers.get("Authorization", "")
    token = auth.split(" ", 1)[1]
    admin_sessions.pop(token, None)
    return jsonify({"success": True, "message": "Logged out"}), 200


@app.route("/admin-check", methods=["GET"])
@admin_required
def admin_check():
    auth = request.headers.get("Authorization", "")
    token = auth.split(" ", 1)[1]
    return jsonify({"authenticated": True, "username": admin_sessions.get(token)}), 200


@app.route("/health", methods=["GET"])
def health():
    trained = all(os.path.exists(p) for p in [LR_PATH, DT_PATH, RF_PATH])
    return jsonify({
        "status":         "ok",
        "models_trained": trained,
        "timestamp":      datetime.now().isoformat(),
    })


@app.route("/upload-dataset", methods=["POST"])
@admin_required
def upload_dataset():
    global training_status
    
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files["file"]
    if not file.filename.endswith(".csv"):
        return jsonify({"error": "Only CSV files accepted"}), 400
    try:
        df = pd.read_csv(file)

        # Step 1: Normalize headers
        df.columns = [str(c).strip().replace('\ufeff', '') for c in df.columns]

        # Step 2: Build case-insensitive lookup and explicit rename map
        col_lower = {c.lower(): c for c in df.columns}
        rename_ops = {}

        # Map Class
        if 'class' in col_lower and 'Class' not in df.columns:
            rename_ops[col_lower['class']] = 'Class'

        # Map Time
        if 'time' in col_lower and 'Time' not in df.columns:
            rename_ops[col_lower['time']] = 'Time'

        # Map Amount
        if 'amount' in col_lower and 'Amount' not in df.columns:
            rename_ops[col_lower['amount']] = 'Amount'

        # Map V1..V28
        for i in range(1, 29):
            vi_lower = f'v{i}'
            vi_canon = f'V{i}'
            if vi_lower in col_lower and vi_canon not in df.columns:
                rename_ops[col_lower[vi_lower]] = vi_canon

        # Apply all renames at once
        if rename_ops:
            df = df.rename(columns=rename_ops)

        # Step 3: Validate all required columns exist
        required = ["Time", "Amount", "Class"] + [f"V{i}" for i in range(1, 29)]
        missing = [c for c in required if c not in df.columns]
        if missing:
            actual_cols = sorted(df.columns.tolist())
            return jsonify({
                "error": f"Missing required columns: {missing}. Found: {actual_cols}"
            }), 400

        # Step 4: Validate data quality
        if df["Class"].nunique() != 2:
            return jsonify({"error": "Dataset must contain both Class 0 and Class 1 examples."}), 400

        counts = df["Class"].value_counts()
        if counts.min() < 10:
            return jsonify({"error": "Too few fraud examples for reliable training (need at least 10)."}), 400

      
        # Step 5: Restrict size if needed
        MAX_ROWS = 120000
        if len(df) > MAX_ROWS:
            fraud_df = df[df["Class"] == 1].sample(
                min(len(df[df["Class"] == 1]), MAX_ROWS // 2), random_state=42
        )
        legit_df = df[df["Class"] == 0].sample(
            min(len(df[df["Class"] == 0]), MAX_ROWS // 2), random_state=42
        )
        df = pd.concat([fraud_df, legit_df]).sample(frac=1, random_state=42).reset_index(drop=True)

        # Step 6: Final sanity check before training
        if "Class" not in df.columns or "Time" not in df.columns or "Amount" not in df.columns:
            return jsonify({
                "error": "Critical: Required columns (Class, Time, Amount) missing. Columns: " + str(sorted(df.columns.tolist()))
            }), 500

        # Start training in background thread
        with training_lock:
            training_status["in_progress"] = True
            training_status["error"] = None
            training_status["progress"] = "Starting training..."
        
        thread = threading.Thread(target=_train_in_background, args=(df,), daemon=False)
        thread.start()
        
        return jsonify({
            "success": True, 
            "message": "Training started in background. Check /training-status for progress."
        }), 202
    except Exception as e:
        import traceback
        with training_lock:
            training_status["error"] = f"{type(e).__name__}: {str(e)}"
        return jsonify({
            "error": f"{type(e).__name__}: {str(e)}"
        }), 500


def _train_in_background(df):
    global training_status
    try:
        with training_lock:
            training_status["progress"] = "Training models..."
        metrics = train_models(df)
        with training_lock:
            training_status["in_progress"] = False
            training_status["metrics"] = metrics
            training_status["progress"] = "Training complete"
    except Exception as e:
        import traceback
        with training_lock:
            training_status["in_progress"] = False
            training_status["error"] = f"{type(e).__name__}: {str(e)}\n{traceback.format_exc()}"
            training_status["progress"] = "Training failed"


@app.route("/training-status", methods=["GET"])
@admin_required
def get_training_status():
    global training_status
    with training_lock:
        status = training_status.copy()
    return jsonify(status)


@app.route("/sample-transactions", methods=["GET"])
@admin_required
def get_samples():
    """Return 300 real sample rows (human-readable display + hidden V features)."""
    if not os.path.exists(SAMPLES_PATH):
        return jsonify({"error": "No samples found. Upload and train first."}), 404
    try:
        df = pd.read_csv(SAMPLES_PATH)
        rows = []
        for _, row in df.iterrows():
            hour = int((float(row["Time"]) % 86400) / 3600)
            rows.append({
                "display": {
                    "amount":       round(float(row["Amount"]), 2),
                    "time_seconds": int(row["Time"]),
                    "hour":         hour,
                    "time_label":   f"{hour:02d}:00",
                    "actual_class": int(row["Class"]),
                    "label":        "Fraud" if int(row["Class"]) == 1 else "Legitimate",
                },
                "features": {
                    **{f"v{i}": round(float(row[f"V{i}"]), 6) for i in range(1, 29)},
                    "amount": float(row["Amount"]),
                    "time":   float(row["Time"]),
                },
            })
        return jsonify({"samples": rows, "total": len(rows)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/predict", methods=["POST"])
@admin_required
def predict():
    """
    Accepts real V1-V28 + amount + time from a sample row.
    Returns ensemble prediction.
    """
    if not all(os.path.exists(p) for p in [LR_PATH, DT_PATH, RF_PATH, SCALER_PATH]):
        return jsonify({"error": "Models not trained yet. Upload dataset first."}), 400

    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    required = ["amount", "time"] + [f"v{i}" for i in range(1, 29)]
    missing = [k for k in required if k not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    try:
        # Load scalers
        scalers = joblib.load(SCALER_PATH)
        amount_scaled = float(scalers["amount"].transform([[data["amount"]]])[0][0])
        time_scaled   = float(scalers["time"].transform([[data["time"]]])[0][0])

        v_features = [float(data[f"v{i}"]) for i in range(1, 29)]
        features   = np.array(v_features + [amount_scaled, time_scaled]).reshape(1, -1)

        results = {}
        votes   = 0

        # Load and predict with each model individually to save memory
        for name, path in [("logistic_regression", LR_PATH), ("decision_tree", DT_PATH), ("random_forest", RF_PATH)]:
            model = joblib.load(path)
            pred  = int(model.predict(features)[0])
            proba = float(model.predict_proba(features)[0][1])
            results[name] = {
                "fraud":       pred == 1,
                "probability": round(proba * 100, 2),
            }
            votes += pred
            # Clear model from memory
            del model

        fraud      = votes >= 2
        avg_prob   = round(sum(v["probability"] for v in results.values()) / 3, 2)
        confidence = round(avg_prob if fraud else 100 - avg_prob, 2)

        return jsonify({
            "fraud":      fraud,
            "risk_score": avg_prob,
            "confidence": confidence,
            "models":     results,
            "votes":      f"{votes}/3",
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/validate-card", methods=["POST"])
@admin_required
def validate_card():
    data = request.json
    if not data or "card_number" not in data:
        return jsonify({"error": "card_number required"}), 400
    card   = str(data["card_number"]).replace(" ", "").replace("-", "")
    valid  = luhn_check(card)
    length = len(card)
    network = "Unknown"
    if card.startswith("4"):
        network = "Visa"
    elif len(card) >= 2 and card[:2] in [str(i) for i in range(51, 56)]:
        network = "Mastercard"
    elif len(card) >= 2 and card[:2] in ["34", "37"]:
        network = "American Express"
    elif card.startswith("6011"):
        network = "Discover"
    card_masked = card[:6] + '*' * max(0, len(card) - 10) + card[-4:] if len(card) >= 10 else '*****'
    auth = request.headers.get("Authorization", "")
    token = auth.split(" ", 1)[1] if " " in auth else ""
    username = admin_sessions.get(token, "unknown")

    _record_card_check(
        card_masked=card_masked,
        network=network,
        valid=(13 <= length <= 19 and valid),
        luhn=valid,
        length_valid=(13 <= length <= 19),
        digit_count=length,
        username=username
    )
    return jsonify({
        "valid":        valid,
        "luhn_check":   valid,
        "length_valid": 13 <= length <= 19,
        "digit_count":  length,
        "network":      network,
    })


@app.route("/card-history", methods=["GET"])
@admin_required
def card_history():
    conn = get_db_conn()
    c = conn.cursor()
    c.execute("""
SELECT 
    cc.id, cc.card_masked, cc.network, cc.valid,
    cc.luhn_check, cc.length_valid, cc.digit_count,
    cc.checked_at, a.username
FROM card_checks cc
JOIN admins a ON cc.admin_id = a.id
ORDER BY cc.checked_at DESC
LIMIT 200
""")
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return jsonify({"count": len(rows), "history": rows})


@app.route("/metrics", methods=["GET"])
@admin_required
def get_metrics():
    if not os.path.exists(METRICS_PATH):
        return jsonify({"error": "No metrics. Train models first."}), 404
    with open(METRICS_PATH) as f:
        return jsonify(json.load(f))


@app.route("/test-accuracy", methods=["POST"])
@admin_required
def test_accuracy():
    """Upload a CSV of real rows → get accuracy report."""
    models = load_models()
    if not models:
        return jsonify({"error": "Models not trained yet"}), 400
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    try:
        df = pd.read_csv(request.files["file"])
        v_cols = [f"V{i}" for i in range(1, 29)]
        df["Amount_scaled"] = models["amount_scaler"].transform(df[["Amount"]])
        df["Time_scaled"]   = models["time_scaler"].transform(df[["Time"]])
        X      = df[v_cols + ["Amount_scaled", "Time_scaled"]].values
        y_true = df["Class"].values
        rf     = models["random_forest"]
        y_pred = rf.predict(X)
        cm     = confusion_matrix(y_true, y_pred).tolist()
        return jsonify({
            "total":          int(len(y_true)),
            "fraud_actual":   int(y_true.sum()),
            "fraud_detected": int(y_pred.sum()),
            "accuracy":       round(float(accuracy_score(y_true, y_pred))  * 100, 2),
            "precision":      round(float(precision_score(y_true, y_pred)) * 100, 2),
            "recall":         round(float(recall_score(y_true, y_pred))    * 100, 2),
            "f1":             round(float(f1_score(y_true, y_pred))        * 100, 2),
            "confusion_matrix": cm,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    init_db()
    print("SafeSwipe API → http://localhost:5000")
    app.run(debug=True, host="0.0.0.0", port=5000)
