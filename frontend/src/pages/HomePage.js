import React from 'react';
import { C } from '../theme';

export default function HomePage({ setPage }) {
  return (
    <div style={{ maxWidth:1000, margin:'0 auto', padding:'60px 28px', textAlign:'center' }}>
      <div style={{ marginBottom:40 }}>
        <h1 style={{ fontSize:48, fontWeight:800, marginBottom:12, letterSpacing:'-1px', color:'#FFFFFF', textShadow:'0 2px 16px rgba(0,0,0,0.75)' }}>
          Safe<span style={{ color:'#00F0FF' }}>Swipe</span>
        </h1>
        <p style={{ fontSize:18, color:'#F3F8FF', maxWidth:600, margin:'0 auto', lineHeight:1.6 }}>
          Intelligent credit card fraud detection powered by machine learning. Upload datasets, train models, and detect fraudulent transactions in real-time.
        </p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:20, marginBottom:40 }}>
        {[
          { title:'Upload & Train', desc:'Upload CSV datasets, preprocess with SMOTE, and train multiple ML models automatically.', btn:'Get Started', page:'upload' },
          { title:'Fraud Detection', desc:'Input transaction features and get instant fraud predictions with ensemble voting.', btn:'Detect Now', page:'detect' },
          { title:'Card Validation', desc:'Validate credit card numbers using the Luhn algorithm — fast and secure.', btn:'Validate', page:'validate' },
          { title:'Analytics Dashboard', desc:'Monitor transaction volumes, model performance, and fraud detection metrics.', btn:'View Dashboard', page:'dashboard' },
        ].map((f,i) => (
          <div key={i} style={{
            background:C.navyCard, border:`1px solid ${C.navyBorder}`, borderRadius:16, padding:'28px 24px',
            textAlign:'left', transition:'all 0.2s', cursor:'pointer',
            animation:`fadeUp 0.4s ${i*0.1}s both`
          }} onClick={()=>setPage(f.page)}>
            <h3 style={{ fontSize:18, fontWeight:700, marginBottom:8, color:C.text }}>{f.title}</h3>
            <p style={{ fontSize:14, color:C.text, lineHeight:1.6, marginBottom:20 }}>{f.desc}</p>
            <button style={{
              background:C.teal, color:C.navy, border:'none', borderRadius:8, padding:'10px 16px',
              fontWeight:600, fontSize:13, cursor:'pointer', transition:'all 0.2s'
            }} onClick={(e)=>{e.stopPropagation();setPage(f.page);}}>
              {f.btn}
            </button>
          </div>
        ))}
      </div>

      <div style={{ background:C.navyCard, border:`1px solid ${C.navyBorder}`, borderRadius:16, padding:'32px', marginBottom:40 }}>
        <h2 style={{ fontSize:24, fontWeight:700, marginBottom:16, color:C.text }}>How It Works</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:24 }}>
          {[
            { step:1, title:'Upload Dataset', desc:'Provide credit card transaction data in CSV format with features like V1–V28, Amount, Time, and Class.' },
            { step:2, title:'Preprocess & Balance', desc:'Handle missing values, normalize amounts, and apply SMOTE to balance the highly imbalanced fraud dataset.' },
            { step:3, title:'Train Models', desc:'Train Logistic Regression, Decision Tree, and Random Forest models with optimized hyperparameters.' },
            { step:4, title:'Detect Fraud', desc:'Use ensemble voting for predictions — if 2+ models agree on fraud, flag the transaction.' },
          ].map((s,i) => (
            <div key={i} style={{ textAlign:'center' }}>
              <div style={{
                width:48, height:48, borderRadius:'50%', background:C.teal, color:C.navy,
                display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700,
                fontSize:16, margin:'0 auto 12px'
              }}>{s.step}</div>
              <h4 style={{ fontSize:16, fontWeight:600, marginBottom:8, color:C.text }}>{s.title}</h4>
              <p style={{ fontSize:13, color:C.textMuted, lineHeight:1.5 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:'linear-gradient(135deg,#162040 0%,#0d1628 100%)', border:`1px solid ${C.navyBorder}`, borderRadius:16, padding:'32px', textAlign:'left' }}>
        <h2 style={{ fontSize:24, fontWeight:700, marginBottom:16, color:C.text }}>Technical Overview</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))', gap:20 }}>
          <div>
            <h3 style={{ fontSize:16, fontWeight:600, marginBottom:10, color:C.teal }}>Machine Learning Models</h3>
              <ul style={{ fontSize:13, color:C.text, lineHeight:1.8 }}>
              <li>Logistic Regression (94.2% accuracy)</li>
              <li>Decision Tree (96.8% accuracy)</li>
              <li>Random Forest (99.1% accuracy)</li>
              <li>Ensemble voting for final decisions</li>
            </ul>
          </div>
          <div>
            <h3 style={{ fontSize:16, fontWeight:600, marginBottom:10, color:C.teal }}>Data Processing</h3>
            <ul style={{ fontSize:13, color:C.text, lineHeight:1.8 }}>
              <li>SMOTE for class balancing</li>
              <li>StandardScaler for normalization</li>
              <li>80/20 train/test split</li>
              <li>Handles 284,807+ transactions</li>
            </ul>
          </div>
          <div>
            <h3 style={{ fontSize:16, fontWeight:600, marginBottom:10, color:C.teal }}>Security & Performance</h3>
            <ul style={{ fontSize:13, color:C.text, lineHeight:1.8 }}>
              <li>Luhn algorithm validation</li>
              <li>Sub-2 second predictions</li>
              <li>SQLite database storage</li>
              <li>CORS-enabled Flask API</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
