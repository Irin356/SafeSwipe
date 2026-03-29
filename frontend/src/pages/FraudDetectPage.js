import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { C, API } from '../theme';

function Spinner() {
  return (
    <div style={{ textAlign:'center', padding:'48px 0' }}>
      <div style={{
        width:38, height:38,
        border:`3px solid ${C.navyBorder}`,
        borderTopColor: C.teal,
        borderRadius:'50%',
        animation:'spin 0.8s linear infinite',
        margin:'0 auto 14px',
      }} />
      <div style={{ color:C.textMuted, fontSize:13 }}>Running ensemble prediction…</div>
      <div style={{ color:C.textDim, fontSize:11, marginTop:6 }}>LR → DT → RF → Majority Vote</div>
    </div>
  );
}

export default function FraudDetectPage() {
  const [samples, setSamples]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [selected, setSelected]     = useState(null);
  const [result, setResult]         = useState(null);
  const [filter, setFilter]         = useState('all');   // all | fraud | legit
  const [history, setHistory]       = useState([]);
  const [error, setError]           = useState('');

  useEffect(() => { fetchSamples(); }, []);

  async function fetchSamples() {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API}/sample-transactions`);
      setSamples(res.data.samples);
    } catch {
      setError('Could not load samples. Make sure Flask is running and models are trained.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePredict(sample) {
    setSelected(sample);
    setResult(null);
    setPredicting(true);
    try {
      const res = await axios.post(`${API}/predict`, sample.features);
      setResult({ ...res.data, actual: sample.display.actual_class });
      setHistory(h => [
        {
          id: Date.now(),
          amount: sample.display.amount,
          time_label: sample.display.time_label,
          actual: sample.display.actual_class,
          predicted: res.data.fraud ? 1 : 0,
          confidence: res.data.confidence,
          correct: res.data.fraud === (sample.display.actual_class === 1),
        },
        ...h.slice(0, 14),
      ]);
    } catch (e) {
      setError(e.response?.data?.error || 'Prediction failed.');
    } finally {
      setPredicting(false);
    }
  }

  const filtered = samples.filter(s => {
    if (filter === 'fraud') return s.display.actual_class === 1;
    if (filter === 'legit') return s.display.actual_class === 0;
    return true;
  });

  const accuracy = history.length
    ? Math.round(history.filter(h => h.correct).length / history.length * 100)
    : null;

  return (
    <div style={{ maxWidth:1080, margin:'0 auto', padding:'36px 28px' }}>
      <h2 style={{ fontSize:26, fontWeight:700, marginBottom:6, letterSpacing:'-0.5px' }}>Fraud Detection</h2>
      <p style={{ color:C.textMuted, fontSize:13, marginBottom:28 }}>
        Select any real transaction row from the Kaggle dataset. The system sends its actual V1–V28 values to the ML models for a genuine prediction.
      </p>

      {error && (
        <div style={{ background:C.redGlow, border:`1px solid rgba(255,77,106,0.3)`, borderRadius:10, padding:'12px 16px', color:C.red, fontSize:13, marginBottom:20 }}>
          ⚠ {error}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:22 }}>

        {/* ── Left: Sample Picker ── */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontWeight:600, fontSize:13, color:C.textMuted, textTransform:'uppercase', letterSpacing:1 }}>
              Pick a Transaction
            </div>
            <div style={{ display:'flex', gap:6 }}>
              {['all','fraud','legit'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  background: filter===f ? C.tealGlow : 'transparent',
                  border: `1px solid ${filter===f ? 'rgba(0,201,167,0.4)' : C.navyBorder}`,
                  color: filter===f ? C.teal : C.textMuted,
                  borderRadius:6, padding:'4px 11px', fontSize:11,
                  fontFamily:'Space Grotesk,sans-serif', cursor:'pointer',
                  textTransform:'capitalize',
                }}>{f}</button>
              ))}
            </div>
          </div>

          {loading && (
            <div style={{ textAlign:'center', padding:40, color:C.textMuted, fontSize:13 }}>
              Loading samples…
            </div>
          )}

          <div style={{ maxHeight:520, overflowY:'auto', display:'flex', flexDirection:'column', gap:8 }}>
            {filtered.map((s, i) => {
              const isFraud = s.display.actual_class === 1;
              const isSelected = selected === s;
              return (
                <div
                  key={i}
                  onClick={() => handlePredict(s)}
                  style={{
                    background: isSelected ? (isFraud ? C.redGlow : C.tealGlow) : C.navyCard,
                    border: `1px solid ${isSelected ? (isFraud ? 'rgba(255,77,106,0.5)' : 'rgba(0,201,167,0.5)') : C.navyBorder}`,
                    borderRadius:10, padding:'13px 16px',
                    cursor:'pointer',
                    transition:'all 0.15s',
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = C.teal; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = C.navyBorder; }}
                >
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:15, fontWeight:600, color:C.text }}>
                        ${s.display.amount.toFixed(2)}
                      </span>
                      <span style={{
                        fontSize:10, padding:'2px 9px', borderRadius:20,
                        background: isFraud ? C.redGlow : C.tealGlow,
                        color: isFraud ? C.red : C.teal,
                        border:`1px solid ${isFraud ? 'rgba(255,77,106,0.3)' : 'rgba(0,201,167,0.3)'}`,
                      }}>
                        {isFraud ? 'FRAUD' : 'LEGIT'}
                      </span>
                    </div>
                    <div style={{ fontSize:11, color:C.textDim }}>
                      Time: {s.display.time_label} · V14: {s.features.v14?.toFixed(3)}
                    </div>
                  </div>
                  <div style={{ fontSize:11, color:C.textDim, fontFamily:'monospace' }}>
                    {isFraud ? '⚠' : '✓'}
                  </div>
                </div>
              );
            })}
          </div>

          {accuracy !== null && (
            <div style={{
              marginTop:14, background:C.navyCard, border:`1px solid ${C.navyBorder}`,
              borderRadius:10, padding:'12px 16px',
              display:'flex', justifyContent:'space-between', alignItems:'center',
            }}>
              <span style={{ fontSize:13, color:C.textMuted }}>Session Accuracy</span>
              <span style={{ fontFamily:'monospace', fontSize:16, fontWeight:700, color:C.teal }}>{accuracy}%</span>
            </div>
          )}
        </div>

        {/* ── Right: Result ── */}
        <div>
          {predicting && <Spinner />}

          {!predicting && !result && (
            <div style={{
              background:C.navyCard, border:`1px dashed ${C.navyBorder}`,
              borderRadius:12, padding:'56px 32px', textAlign:'center', color:C.textDim,
            }}>
              <div style={{ fontSize:42, marginBottom:12 }}>🔍</div>
              <div style={{ fontSize:14, marginBottom:8 }}>Select a transaction on the left</div>
              <div style={{ fontSize:12 }}>Real V1–V28 values will be sent to all three models</div>
            </div>
          )}

          {result && !predicting && (
            <div className="anim">
              {/* Verdict */}
              <div style={{
                background: result.fraud ? C.redGlow : C.tealGlow,
                border:`1px solid ${result.fraud ? 'rgba(255,77,106,0.4)' : 'rgba(0,201,167,0.4)'}`,
                borderRadius:12, padding:'22px', marginBottom:14,
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                  <div>
                    <div style={{ fontSize:11, color:C.textMuted, marginBottom:4, textTransform:'uppercase', letterSpacing:1 }}>Model Verdict</div>
                    <div style={{ fontSize:30, fontWeight:700, color: result.fraud ? C.red : C.teal }}>
                      {result.fraud ? '⚠ FRAUD' : '✓ LEGITIMATE'}
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:11, color:C.textMuted, marginBottom:4 }}>Confidence</div>
                    <div style={{ fontSize:26, fontWeight:700, fontFamily:'monospace', color: result.fraud ? C.red : C.teal }}>
                      {result.confidence}%
                    </div>
                  </div>
                </div>

                {/* Correct/Wrong badge */}
                <div style={{
                  display:'inline-flex', alignItems:'center', gap:6,
                  fontSize:12, padding:'5px 12px', borderRadius:20,
                  background: result.fraud === (result.actual === 1) ? 'rgba(0,201,167,0.15)' : 'rgba(255,187,51,0.15)',
                  color: result.fraud === (result.actual === 1) ? C.teal : C.amber,
                  border:`1px solid ${result.fraud === (result.actual === 1) ? 'rgba(0,201,167,0.3)' : 'rgba(255,187,51,0.3)'}`,
                }}>
                  {result.fraud === (result.actual === 1)
                    ? '✓ Correct prediction'
                    : '✗ Incorrect prediction'}
                  &nbsp;· Actual: {result.actual === 1 ? 'FRAUD' : 'LEGIT'}
                </div>

                {/* Risk bar */}
                <div style={{ marginTop:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:C.textMuted, marginBottom:6 }}>
                    <span>Risk Score</span>
                    <span style={{ fontFamily:'monospace', color: result.risk_score > 50 ? C.red : C.teal }}>{result.risk_score}/100</span>
                  </div>
                  <div style={{ background:C.navyBorder, borderRadius:4, height:6, overflow:'hidden' }}>
                    <div style={{
                      height:'100%', width:`${result.risk_score}%`,
                      background: result.risk_score > 50 ? C.red : C.teal,
                      borderRadius:4, animation:'barFill 0.8s ease',
                    }} />
                  </div>
                </div>
              </div>

              {/* Model Breakdown */}
              <div style={{ background:C.navyCard, border:`1px solid ${C.navyBorder}`, borderRadius:12, padding:'18px 20px', marginBottom:14 }}>
                <div style={{ fontSize:11, color:C.textMuted, textTransform:'uppercase', letterSpacing:1, marginBottom:14 }}>Model Breakdown</div>
                {Object.entries(result.models).map(([name, m]) => (
                  <div key={name} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                    <div style={{ fontSize:12, color:C.textMuted, minWidth:160 }}>
                      {name.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
                    </div>
                    <div style={{ flex:1, background:C.navyBorder, borderRadius:4, height:5 }}>
                      <div style={{ height:'100%', width:`${m.probability}%`, background: m.fraud ? C.red : C.teal, borderRadius:4 }} />
                    </div>
                    <div style={{ fontSize:12, fontFamily:'monospace', color: m.fraud ? C.red : C.teal, minWidth:40, textAlign:'right' }}>{m.probability}%</div>
                    <div style={{ fontSize:11, color: m.fraud ? C.red : C.teal, minWidth:42, textAlign:'right' }}>{m.fraud ? 'FRAUD' : 'LEGIT'}</div>
                  </div>
                ))}
                <div style={{ fontSize:12, color:C.textDim, marginTop:8, borderTop:`1px solid ${C.navyBorder}`, paddingTop:10 }}>
                  Majority vote: {result.votes} models flagged as fraud
                </div>
              </div>

              {/* Transaction info */}
              {selected && (
                <div style={{ background:C.navyCard, border:`1px solid ${C.navyBorder}`, borderRadius:12, padding:'16px 20px' }}>
                  <div style={{ fontSize:11, color:C.textMuted, textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Transaction Details</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {[
                      { label:'Amount',    value:`$${selected.display.amount.toFixed(2)}` },
                      { label:'Time',      value:selected.display.time_label },
                      { label:'V1',        value:selected.features.v1?.toFixed(4) },
                      { label:'V14 (key)', value:selected.features.v14?.toFixed(4) },
                    ].map(d => (
                      <div key={d.label} style={{ fontSize:12 }}>
                        <span style={{ color:C.textMuted }}>{d.label}: </span>
                        <span style={{ fontFamily:'monospace', color:C.text }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* History Table */}
      {history.length > 0 && (
        <div style={{ marginTop:32 }}>
          <div style={{ fontSize:12, color:C.textMuted, textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>
            Prediction History (this session)
          </div>
          <div style={{ background:C.navyCard, border:`1px solid ${C.navyBorder}`, borderRadius:12, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${C.navyBorder}` }}>
                  {['Amount','Time','Actual','Predicted','Confidence','Result'].map(h => (
                    <th key={h} style={{ padding:'10px 16px', textAlign:'left', color:C.textMuted, fontWeight:500, fontSize:11, textTransform:'uppercase', letterSpacing:0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: i < history.length-1 ? `1px solid ${C.navyBorder}` : 'none' }}>
                    <td style={{ padding:'10px 16px', fontFamily:'monospace', color:C.text }}>${r.amount.toFixed(2)}</td>
                    <td style={{ padding:'10px 16px', color:C.textMuted }}>{r.time_label}</td>
                    <td style={{ padding:'10px 16px' }}>
                      <span style={{ fontSize:10, color: r.actual===1 ? C.red : C.teal }}>{r.actual===1?'FRAUD':'LEGIT'}</span>
                    </td>
                    <td style={{ padding:'10px 16px' }}>
                      <span style={{ fontSize:10, color: r.predicted===1 ? C.red : C.teal }}>{r.predicted===1?'FRAUD':'LEGIT'}</span>
                    </td>
                    <td style={{ padding:'10px 16px', fontFamily:'monospace', color:C.textMuted }}>{r.confidence}%</td>
                    <td style={{ padding:'10px 16px' }}>
                      <span style={{ fontSize:11, color: r.correct ? C.teal : C.amber }}>{r.correct ? '✓ Correct' : '✗ Wrong'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
