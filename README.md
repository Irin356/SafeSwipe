# SafeSwipe: AI-Powered Fraud Detection Platform

SafeSwipe is a full-stack fraud detection platform that uses machine learning to identify suspicious financial transactions in real time. It combines a Flask backend, a React frontend, and trained classification models to help detect fraud, validate cards, and monitor performance through an interactive dashboard.

## Key Features

- **Real-Time Fraud Detection**: Predicts whether a transaction is fraudulent using trained ML models.
- **Multiple Classification Models**: Supports Logistic Regression, Decision Tree, and Random Forest classifiers.
- **Imbalanced Data Handling**: Uses SMOTE oversampling to improve fraud class detection.
- **Secure Card Validation**: Includes Luhn algorithm-based card number validation.
- **CSV Data Upload**: Allows admins to upload transaction datasets for preprocessing and analysis.
- **Interactive Dashboard**: Displays model metrics and system status in a user-friendly interface.
- **Admin Authentication**: Supports secure admin login and session-based access control.
- **Scalable Architecture**: Built with a modular Flask backend and React frontend.

## Screenshots

## Landing Page
<img width="1536" height="955" alt="Landing Page" src="https://github.com/user-attachments/assets/adf48966-8af3-47c0-bea7-2abc80b1f176" />

## Login Page
<img width="809" height="936" alt="Login Page" src="https://github.com/user-attachments/assets/ad54e07d-3093-479f-a891-1567bb4212ed" />

## Register Page
<img width="1032" height="938" alt="Register Page" src="https://github.com/user-attachments/assets/47fff190-2323-4c63-a03a-d80c4b12e2ef" />

## Analytics Dashboard
<img width="1510" height="955" alt="Analytics Dashboard" src="https://github.com/user-attachments/assets/c3cd8301-d127-4071-9ec6-2a225eda3214" />

## Fraud Detection Page
<img width="1733" height="969" alt="Fraud Detection Page" src="https://github.com/user-attachments/assets/36a6daab-77be-4041-b2fb-667fc6729fec" />


## Technology Stack

### Backend
- Flask
- Scikit-learn
- SQLite
- SMOTE
- Joblib
- Werkzeug

### Frontend
- React 18
- Tailwind CSS
- Axios
- React Router

### Tools and Libraries
- Python 3.8+
- Node.js
- npm
- Git

## Datasets Used

SafeSwipe was built using Kaggle credit card fraud datasets for training and evaluation

- **Credit Card Fraud Detection** — 284,807 rows, features V1 to V28.
- **Credit Card Fraud Detection Dataset 2023** — 550,000 rows.

These datasets helped in training and evaluating fraud detection models under imbalanced-class conditions.

## Installation and Setup

### Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm
- Git

### Backend Setup

```bash
git clone <repository-url>
cd SafeSwipe/backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python app.py
```

The backend will run at:

```bash
http://localhost:5000/
```

### Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

The frontend will run at:

```bash
http://localhost:3000/
```

## Usage

1. Open the frontend in your browser.
2. Upload a transaction dataset in CSV format.
3. Train or evaluate the fraud detection models.
4. Submit transaction details to get a fraud prediction.
5. View performance metrics on the dashboard.
6. Use the admin portal for secure authentication and system management.

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Checks system status and model training state |
| `/upload` | POST | Uploads CSV file for transaction data |
| `/train` | POST | Starts the ML training pipeline |
| `/predict` | POST | Predicts fraud for a transaction |
| `/validate-card` | POST | Validates a credit card number |
| `/admin-login` | POST | Authenticates admin user |
| `/admin-check` | GET | Validates admin session |

## Project Structure

```text
SafeSwipe/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── instance/
│   └── models/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.js
│   │   ├── theme.js
│   │   └── index.js
│   ├── package.json
│   └── tailwind.config.js
├── .gitignore
├── LICENSE
└── README.md
```

## Model Performance

SafeSwipe evaluates multiple classification models using standard fraud detection metrics:

- Best Model: Random Forest

- Accuracy: 98.12%

- Precision: 96.44%

- Recall: 95.73%

- F1-Score: 96.08%

The platform is designed to help compare model performance and identify the best-performing classifier for fraud detection.

## My Role

**Team Lead**

I led the development of SafeSwipe, focusing on the fraud detection workflow, model integration, backend API design, and overall coordination of the project.

## Contributing

Contributions are welcome. If you want to improve the fraud detection pipeline, UI, model performance, or system reliability, feel free to fork the repository and submit a pull request.

## License

This project is licensed under the MIT License.
