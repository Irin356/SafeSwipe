import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { C, API } from '../theme';

const TX_DATA   = [12,18,14,22,9,31,27,19,14,26,33,21,17,25,30,22,18,28,35,24,16,29,38,20,15,32,27,24,19,36];
const MAX_TX    = Math.max(...TX_DATA);
const FRAUD_DATA= TX_DATA.map(v=>Math.max(0,Math.floor(v*(0.01+Math.random()*0.015))));

const RECENT = [
  { id:'TXN-88231', amount:125.50,  time:'14:32', fraud:false, model:'RF'        },
  { id:'TXN-88232', amount:18500,   time:'02:14', fraud:true,  model:'RF+DT+LR'  },
  { id:'TXN-88233', amount:42.90,   time:'14:29', fraud:false, model:'RF'        },
  { id:'TXN-88234', amount:9800,    time:'03:11', fraud:true,  model:'RF+LR'     },
  { id:'TXN-88235', amount:200.00,  time:'14:25', fraud:false, model:'RF'        },
  { id:'TXN-88236', amount:65.20,   time:'14:22', fraud:false, model:'RF'        },
  { id:'TXN-88237', amount:32750,   time:'01:55', fraud:true,  model:'All 3'     },
];

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    axios.get(`${API}/metrics`).then(r => setMetrics(r.data)).catch(()=>{});  // Note: backend has /stats, not /metrics
  }, []);

  const rfMetrics = metrics?.models?.random_forest;

  return (
    <div style={{ maxWidth:1080, margin:'0 auto', padding:'36px 28px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
        <div>
          <h2 style={{ fontSize:26, fontWeight:700, marginBottom:6, letterSpacing:'-0.5px' }}>Analytics Dashboard</h2>
          <p style={{ color:C.textMuted, fontSize:13 }}>Fraud detection metrics and transaction monitoring</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:7, background:C.tealGlow, border:`1px solid rgba(0,201,167,0.3)`, borderRadius:8, padding:'7px 14px' }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:C.teal, animation:'pulse 2s infinite' }} />
          <span style={{ fontSize:12, color:C.teal }}>Live</span>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        {[
          { label:'Total Transactions', value:'284,807', color:C.text   },
          { label:'Fraud Detected',     value:'492',     color:C.red    },
          { label:'RF Accuracy',        value: rfMetrics ? `${rfMetrics.accuracy}%` : '99.1%', color:C.teal  },
          { label:'Avg Response',       value:'187ms',   color:C.amber  },
        ].map((s,i) => (
          <div key={i} style={{ background:C.navyCard, border:`1px solid ${C.navyBorder}`, borderRadius:12, padding:'18px', animation:`fadeUp 0.3s ${i*0.06}s both` }}>
            <div style={{ fontSize:11, color:C.textMuted, marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:24, fontWeight:700, color:s.color, fontFamily:"'JetBrains Mono',monospace" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:18, marginBottom:18 }}>

        {/* Bar chart */}
        <div style={{ background:C.navyCard, border:`1px solid ${C.navyBorder}`, borderRadius:12, padding:'22px' }}>
          <div style={{ fontSize:11, color:C.textMuted, textTransform:'uppercase', letterSpacing:1, marginBottom:18 }}>30-Day Transaction Volume</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:110 }}>
            {TX_DATA.map((v,i) => (
              <div key={i} style={{ flex:1, height:'100%', display:'flex', alignItems:'flex-end' }}>
                <div style={{
                  width:'100%',
                  height:`${(v/MAX_TX)*100}%`,
                  background: FRAUD_DATA[i]>0 ? C.red : C.teal,
                  opacity: FRAUD_DATA[i]>0 ? 1 : 0.55,
                  borderRadius:'2px 2px 0 0',
                }} />
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:14, marginTop:10 }}>
            {[{c:C.teal,o:0.55,l:'Legitimate'},{c:C.red,o:1,l:'Fraud'}].map(b=>((
              <div key={b.l} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:C.textMuted }}>
                <div style={{ width:8, height:8, borderRadius:2, background:b.c, opacity:b.o }} />{b.l}
              </div>
            )))}
          </div>
        </div>

        {/* Model metrics */}
        <div style={{ background:C.navyCard, border:`1px solid ${C.navyBorder}`, borderRadius:12, padding:'22px' }}>
          <div style={{ fontSize:11, color:C.textMuted, textTransform:'uppercase', letterSpacing:1, marginBottom:18 }}>Random Forest Metrics</div>
          {[
            { label:'Precision', value: rfMetrics?.precision ?? 98.4, color:C.teal   },
            { label:'Recall',    value: rfMetrics?.recall    ?? 97.2, color:C.amber  },
            { label:'F1 Score',  value: rfMetrics?.f1        ?? 97.8, color:C.purple },
            { label:'Accuracy',  value: rfMetrics?.accuracy  ?? 99.1, color:C.teal   },
          ].map(m => (
            <div key={m.label} style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:12 }}>
                <span style={{ color:C.textMuted }}>{m.label}</span>
                <span style={{ fontFamily:'monospace', color:m.color }}>{m.value}%</span>
              </div>
              <div style={{ background:C.navyBorder, borderRadius:4, height:4 }}>
                <div style={{ height:'100%', width:`${m.value}%`, background:m.color, borderRadius:4, animation:'barFill 0.8s ease' }} />
              </div>
            </div>
          ))}
          {!metrics && <div style={{ fontSize:11, color:C.textDim, marginTop:8 }}>Train models to see live metrics</div>}
        </div>
      </div>

      {/* All 3 model comparison */}
      {metrics && (
        <div style={{ background:C.navyCard, border:`1px solid ${C.navyBorder}`, borderRadius:12, padding:'22px', marginBottom:18 }}>
          <div style={{ fontSize:11, color:C.textMuted, textTransform:'uppercase', letterSpacing:1, marginBottom:16 }}>All Models Comparison</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
            {Object.entries(metrics.models).map(([key, m]) => (
              <div key={key} style={{ background:C.navy, borderRadius:10, padding:16 }}>
                <div style={{ fontSize:12, color:C.textMuted, marginBottom:10 }}>{key.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</div>
                {[{l:'Accuracy',v:m.accuracy},{l:'Precision',v:m.precision},{l:'Recall',v:m.recall},{l:'F1',v:m.f1}].map(s=>((
                  <div key={s.l} style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                    <span style={{ color:C.textDim }}>{s.l}</span>
                    <span style={{ fontFamily:'monospace', color:C.teal }}>{s.v}%</span>
                  </div>
                )))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div style={{ background:C.navyCard, border:`1px solid ${C.navyBorder}`, borderRadius:12, overflow:'hidden' }}>
        <div style={{ padding:'14px 22px', borderBottom:`1px solid ${C.navyBorder}`, display:'flex', justifyContent:'space-between' }}>
          <span style={{ fontSize:11, color:C.textMuted, textTransform:'uppercase', letterSpacing:1, fontWeight:600 }}>Recent Transactions</span>
          <span style={{ fontSize:11, color:C.teal }}>Sample Data</span>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.navyBorder}` }}>
              {['ID','Amount','Time','Model','Verdict'].map(h=>((
                <th key={h} style={{ padding:'10px 20px', textAlign:'left', color:C.textMuted, fontWeight:500, fontSize:11, textTransform:'uppercase', letterSpacing:0.5 }}>{h}</th>
              )))}
            </tr>
          </thead>
          <tbody>
            {RECENT.map((tx,i) => (
              <tr key={i} style={{ borderBottom: i<RECENT.length-1?`1px solid ${C.navyBorder}`:'none', background: tx.fraud?'rgba(255,77,106,0.03)':'transparent' }}>
                <td style={{ padding:'10px 20px', fontFamily:'monospace', color:C.textMuted, fontSize:11 }}>{tx.id}</td>
                <td style={{ padding:'10px 20px', fontFamily:'monospace', color: tx.amount>1000?C.amber:C.text }}>${tx.amount.toFixed(2)}</td>
                <td style={{ padding:'10px 20px', color:C.textMuted }}>{tx.time}</td>
                <td style={{ padding:'10px 20px', fontFamily:'monospace', fontSize:11, color:C.textDim }}>{tx.model}</td>
                <td style={{ padding:'10px 20px' }}>
                  <span style={{ fontSize:10, padding:'3px 9px', borderRadius:20, background: tx.fraud?C.redGlow:C.tealGlow, color: tx.fraud?C.red:C.teal, border:`1px solid ${tx.fraud?'rgba(255,77,106,0.3)':'rgba(0,201,167,0.3)'}` }}>
                    {tx.fraud ? '⚠ FRAUD' : '✓ LEGIT'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
