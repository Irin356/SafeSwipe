import React, { useState } from 'react';
import { C } from '../theme';

const MODELS = {
  lr: {
    name:'Logistic Regression', tag:'Baseline', tagColor:C.textMuted,
    accuracy:94.2, precision:91.5, recall:88.3, f1:89.9,
    desc:'A linear classifier that estimates fraud probability using a logistic function. Very fast and interpretable — good as a baseline comparison against more complex models.',
    pros:['Highly interpretable','Fastest training','Low memory usage','Good baseline'],
    cons:['Assumes linearity','Misses complex patterns','Lower accuracy'],
    code:`from sklearn.linear_model import LogisticRegression

model = LogisticRegression(
    max_iter=1000,
    C=1.0,
    random_state=42
)
model.fit(X_train, y_train)`,
  },
  dt: {
    name:'Decision Tree', tag:'Interpretable', tagColor:C.amber,
    accuracy:96.8, precision:95.1, recall:93.7, f1:94.4,
    desc:'Splits data using feature threshold rules. Fully visualizable — you can print the tree and explain every decision. Prone to overfitting without depth limits.',
    pros:['Easy to visualize','No feature scaling needed','Handles nonlinear patterns','Built-in feature importance'],
    cons:['Prone to overfitting','High variance','Less robust than RF'],
    code:`from sklearn.tree import DecisionTreeClassifier

model = DecisionTreeClassifier(
    max_depth=15,
    min_samples_split=5,
    random_state=42
)
model.fit(X_train, y_train)`,
  },
  rf: {
    name:'Random Forest', tag:'Best Model', tagColor:C.teal,
    accuracy:99.1, precision:98.4, recall:97.2, f1:97.8,
    desc:'An ensemble of 100 decision trees trained on random feature subsets. Resistant to overfitting and the best model for imbalanced fraud datasets combined with SMOTE.',
    pros:['Highest accuracy (99.1%)','Handles class imbalance well','Robust to overfitting','Best for production'],
    cons:['Slower than LR','Higher memory usage','Less interpretable'],
    code:`from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier(
    n_estimators=100,
    n_jobs=-1,
    random_state=42
)
model.fit(X_train, y_train)

# Get fraud probability (not just 0/1)
proba = model.predict_proba(X_test)[:,1]`,
  },
};

export default function ModelsPage() {
  const [active, setActive] = useState('rf');
  const m = MODELS[active];

  return (
    <div style={{ maxWidth:1000, margin:'0 auto', padding:'36px 28px' }}>
      <h2 style={{ fontSize:26, fontWeight:700, marginBottom:6, letterSpacing:'-0.5px' }}>ML Models</h2>
      <p style={{ color:C.textMuted, fontSize:13, marginBottom:28 }}>Three models form an ensemble — majority vote decides the final verdict.</p>

      {/* Model selector */}
      <div style={{ display:'flex', gap:12, marginBottom:28 }}>
        {Object.entries(MODELS).map(([key, mod]) => (
          <button key={key} onClick={()=>setActive(key)} style={{
            flex:1, background: active===key ? C.navyCard : 'transparent',
            border:`1px solid ${active===key ? C.teal : C.navyBorder}`,
            borderRadius:10, padding:'16px', textAlign:'left',
            color:C.text, cursor:'pointer', transition:'all 0.2s',
            fontFamily:'Space Grotesk,sans-serif',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:13, fontWeight:600 }}>{mod.name}</span>
              <span style={{ fontSize:10, color:mod.tagColor, border:`1px solid ${mod.tagColor}44`, borderRadius:12, padding:'1px 8px' }}>{mod.tag}</span>
            </div>
            <div style={{ fontSize:22, fontWeight:700, fontFamily:'monospace', color: active===key ? C.teal : C.textMuted }}>{mod.accuracy}%</div>
            <div style={{ fontSize:11, color:C.textDim }}>accuracy</div>
          </button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }} className="anim">

        {/* Left */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ background:C.navyCard, border:`1px solid ${C.navyBorder}`, borderRadius:12, padding:'22px' }}>
            <h3 style={{ fontWeight:600, fontSize:15, marginBottom:10 }}>{m.name}</h3>
            <p style={{ fontSize:13, color:C.textMuted, lineHeight:1.7, marginBottom:18 }}>{m.desc}</p>
            {[
              {l:'Precision', v:m.precision, c:C.teal  },
              {l:'Recall',    v:m.recall,    c:C.amber  },
              {l:'F1 Score',  v:m.f1,        c:C.purple },
              {l:'Accuracy',  v:m.accuracy,  c:C.teal   },
            ].map(s=>((
              <div key={s.l} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:12 }}>
                  <span style={{ color:C.textMuted }}>{s.l}</span>
                  <span style={{ fontFamily:'monospace', color:s.c }}>{s.v}%</span>
                </div>
                <div style={{ background:C.navyBorder, borderRadius:4, height:5 }}>
                  <div style={{ height:'100%', width:`${s.v}%`, background:s.c, borderRadius:4, animation:'barFill 0.7s ease' }} />
                </div>
              </div>
            )))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[{title:'Pros', items:m.pros, color:C.teal},{title:'Cons', items:m.cons, color:C.red}].map(side=>((
              <div key={side.title} style={{ background:C.navyCard, border:`1px solid ${C.navyBorder}`, borderRadius:10, padding:'14px' }}>
                <div style={{ fontSize:11, color:side.color, marginBottom:10, textTransform:'uppercase', letterSpacing:0.5 }}>{side.title}</div>
                {side.items.map((p,i)=>((
                  <div key={i} style={{ fontSize:12, color:C.textMuted, marginBottom:5 }}>
                    {side.title==='Pros'?'✓':'✗'} {p}
                  </div>
                )))}
              </div>
            )))}
          </div>
        </div>

        {/* Right: code */}
        <div>
          <div style={{ background:'#060b14', border:`1px solid ${C.navyBorder}`, borderRadius:12, padding:'22px', height:'100%' }}>
            <div style={{ fontSize:11, color:C.textDim, textTransform:'uppercase', letterSpacing:1, marginBottom:14 }}>Python Implementation</div>
            <pre style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12.5, color:'#8BE9FD', lineHeight:1.85, whiteSpace:'pre-wrap', margin:0 }}>{m.code}</pre>

            <div style={{ borderTop:`1px solid ${C.navyBorder}`, marginTop:22, paddingTop:18 }}>
              <div style={{ fontSize:11, color:C.textDim, textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Save &amp; Load (joblib)</div>
              <pre style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:'#FFB86C', lineHeight:1.85, whiteSpace:'pre-wrap', margin:0 }}>
{`import joblib

# Save after training
joblib.dump(model, 'models/random_forest.pkl')

# Load in Flask API
model = joblib.load('models/random_forest.pkl')
pred  = model.predict(features)
proba = model.predict_proba(features)[:,1]`}
              </pre>
            </div>

            <div style={{ borderTop:`1px solid ${C.navyBorder}`, marginTop:22, paddingTop:18 }}>
              <div style={{ fontSize:11, color:C.textDim, textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>SMOTE (class balancing)</div>
              <pre style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:'#50FA7B', lineHeight:1.85, whiteSpace:'pre-wrap', margin:0 }}>
{`from imblearn.over_sampling import SMOTE

sm = SMOTE(random_state=42)
X_res, y_res = sm.fit_resample(X, y)
# Before: 284315 legit, 492 fraud
# After:  balanced classes`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Ensemble explanation */}
      <div style={{ marginTop:20, background:C.navyCard, border:`1px solid ${C.navyBorder}`, borderRadius:12, padding:'22px' }}>
        <div style={{ fontWeight:600, fontSize:14, marginBottom:14 }}>How Ensemble Voting Works</div>
        <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          {['Logistic Regression','Decision Tree','Random Forest'].map((n,i)=>((
            <React.Fragment key={n}>
              <div style={{ background:C.navy, border:`1px solid ${C.navyBorder}`, borderRadius:8, padding:'10px 14px', fontSize:12, color:C.textMuted, textAlign:'center' }}>
                <div style={{ marginBottom:4 }}>{n}</div>
                <div style={{ color:C.teal, fontFamily:'monospace', fontSize:11 }}>0 or 1</div>
              </div>
              {i < 2 && <div style={{ color:C.textDim, fontSize:18 }}>+</div>}
            </React.Fragment>
          )))}
          <div style={{ color:C.textDim, fontSize:18 }}>→</div>
          <div style={{ background:C.tealGlow, border:`1px solid rgba(0,201,167,0.3)`, borderRadius:8, padding:'10px 16px', fontSize:12, color:C.teal, textAlign:'center' }}>
            <div style={{ marginBottom:4 }}>Majority Vote</div>
            <div style={{ fontFamily:'monospace', fontSize:11 }}>≥ 2/3 = FRAUD</div>
          </div>
        </div>
        <div style={{ fontSize:12, color:C.textDim, marginTop:14 }}>
          If 2 or more models predict fraud → final verdict is FRAUD. This reduces false positives compared to relying on a single model.
        </div>
      </div>
    </div>
  );
}
