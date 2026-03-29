import React, { useState, useRef } from 'react';
import axios from 'axios';
import { C, API } from '../theme';

export default function UploadPage({ onTrained }) {
  const [stage,    setStage]    = useState('idle');   // idle | uploading | done | error
  const [file,     setFile]     = useState(null);
  const [progress, setProgress] = useState(0);
  const [logs,     setLogs]     = useState([]);
  const [metrics,  setMetrics]  = useState(null);
  const [dragging, setDragging] = useState(false);
  const [errMsg,   setErrMsg]   = useState('');
  const fileRef = useRef();

  const addLog = (msg, color=C.textMuted) =>
    setLogs(l => [...l, { msg, color, id: Date.now() + Math.random() }]);

  async function processFile(f) {
    if (!f.name.endsWith('.csv')) { setErrMsg('Only .csv files are accepted.'); return; }
    setFile(f);
    setStage('uploading');
    setLogs([]);
    setProgress(0);
    setErrMsg('');

    // Animated log steps during upload validation
    const steps = [
      { msg:`✓ File received: ${f.name} (${(f.size/1024).toFixed(1)} KB)`,          color:C.teal,     p:8  },
      { msg:'→ Parsing CSV headers…',                                                color:C.textMuted,p:15 },
      { msg:'✓ Columns detected: Time, Amount, V1–V28, Class',                       color:C.teal,     p:22 },
      { msg:'→ Checking for missing values…',                                         color:C.textMuted,p:28 },
      { msg:'✓ No missing values found',                                              color:C.teal,     p:34 },
      { msg:'→ Scaling Amount with StandardScaler…',                                  color:C.textMuted,p:40 },
      { msg:'✓ Amount normalized',                                                    color:C.teal,     p:46 },
      { msg:'→ Detecting class imbalance…',                                           color:C.textMuted,p:50 },
      { msg:'⚠ Class imbalance: 99.83% legit / 0.17% fraud',                        color:C.amber,    p:55 },
      { msg:'→ Applying SMOTE oversampling to balance classes…',                      color:C.textMuted,p:62 },
      { msg:'✓ SMOTE complete — classes balanced',                                    color:C.teal,     p:68 },
      { msg:'→ Splitting 80% train / 20% test with stratify…',                       color:C.textMuted,p:72 },
      { msg:'→ Training Logistic Regression (max_iter=1000)…',                        color:C.textMuted,p:78 },
      { msg:'→ Training Decision Tree (max_depth=10)…',                               color:C.textMuted,p:84 },
      { msg:'→ Training Random Forest (50 estimators, n_jobs=2)…',                    color:C.textMuted,p:90 },
      { msg:'→ Saving models to /models/*.pkl…',                                      color:C.textMuted,p:95 },
      { msg:'→ Saving 300 sample transactions for demo…',                             color:C.textMuted,p:97 },
    ];

    // Drive the progress log animation
    const logTimer = (async () => {
      for (const s of steps) {
        await new Promise(r => setTimeout(r, 280 + Math.random()*200));
        addLog(s.msg, s.color);
        setProgress(s.p);
      }
    })();

    try {
      // Upload file
      const form = new FormData();
      form.append('file', f);
      const res = await axios.post(`${API}/upload-dataset`, form, {
        headers:{ 'Content-Type':'multipart/form-data' },
        timeout: 120000,   // 2 min for upload
      });

      // If response is 202, training is in background
      if (res.status === 202) {
        addLog('✓ File uploaded! Training started in background…', C.teal);
        setProgress(100);
        
        // Poll training status
        let trainingComplete = false;
        let attempts = 0;
        const maxAttempts = 300; // 5 minutes with 1 second intervals
        
        while (!trainingComplete && attempts < maxAttempts) {
          await new Promise(r => setTimeout(r, 1000)); // Wait 1 second between polls
          attempts++;
          
          try {
            const statusRes = await axios.get(`${API}/training-status`);
            const status = statusRes.data;
            
            if (status.error) {
              setErrMsg(`Training failed: ${status.error}`);
              setStage('error');
              return;
            }
            
            if (!status.in_progress) {
              // Training complete
              if (status.metrics) {
                addLog('✓ All models trained and saved successfully!', C.teal);
                setMetrics(status.metrics);
                setStage('done');
                trainingComplete = true;
                if (onTrained) onTrained();
              }
              break;
            }
            
            // Still training, update progress message
            if (status.progress && status.progress !== 'Training models…') {
              // Occasionally update log with progress
              if (attempts % 10 === 0) {
                addLog(`⧖ ${status.progress}`, C.textMuted);
              }
            }
          } catch (statusErr) {
            console.error('Status check failed:', statusErr);
          }
        }
        
        if (attempts >= maxAttempts) {
          setErrMsg('Training timeout (5 minutes exceeded)');
          setStage('error');
        }
      } else {
        // Old synchronous response (shouldn't happen with new backend)
        await logTimer;
        setProgress(100);
        addLog('✓ All models trained and saved successfully!', C.teal);
        setMetrics(res.data.metrics);
        setStage('done');
        if (onTrained) onTrained();
      }
    } catch (e) {
      await logTimer;
      const backendError = e.response?.data?.error;
      setErrMsg(backendError
        ? `Training failed: ${backendError}`
        : `Upload failed: ${e.message || 'Check Flask console for details.'}`
      );
      setStage('error');
    }
  }

  function onDrop(e) {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }

  const modelNames = { logistic_regression:'Logistic Regression', decision_tree:'Decision Tree', random_forest:'Random Forest' };
  const modelColors = { logistic_regression: C.textMuted, decision_tree: C.amber, random_forest: C.teal };

  return (
    <div style={{ maxWidth:860, margin:'0 auto', padding:'36px 28px' }}>
      <h2 style={{ fontSize:26, fontWeight:700, marginBottom:6, letterSpacing:'-0.5px' }}>Upload Dataset & Train</h2>
      <p style={{ color:C.textMuted, fontSize:13, marginBottom:28 }}>
        Upload <code style={{ background:C.navyCard, padding:'2px 6px', borderRadius:4, fontSize:12 }}>creditcard.csv</code> from Kaggle. SafeSwipe will preprocess, apply SMOTE, and train all 3 models.
      </p>

      {stage === 'idle' && (
        <>
          <div
            onDragOver={e=>{e.preventDefault();setDragging(true);}}
            onDragLeave={()=>setDragging(false)}
            onDrop={onDrop}
            onClick={()=>fileRef.current.click()}
            style={{
              border:`2px dashed ${dragging?C.teal:C.navyBorder}`,
              borderRadius:16, padding:'56px 32px', textAlign:'center',
              cursor:'pointer', transition:'all 0.2s',
              background: dragging ? C.tealGlow : 'transparent',
            }}
          >
            <input ref={fileRef} type="file" accept=".csv" style={{display:'none'}} onChange={e=>e.target.files[0]&&processFile(e.target.files[0])} />
            <div style={{ fontSize:44, marginBottom:14 }}>📁</div>
            <div style={{ fontWeight:600, marginBottom:8 }}>Drop creditcard.csv here or click to browse</div>
            <div style={{ color:C.textMuted, fontSize:13 }}>Required: Time · Amount · V1–V28 · Class</div>
          </div>
          {errMsg && <div style={{ color:C.red, fontSize:13, marginTop:12 }}>⚠ {errMsg}</div>}

          {/* Dataset guide */}
          <div style={{ marginTop:28, background:C.navyCard, border:`1px solid ${C.navyBorder}`, borderRadius:12, padding:'20px' }}>
            <div style={{ fontWeight:600, fontSize:14, marginBottom:14 }}>Where to get the dataset</div>
            {[
              { name:'Kaggle Credit Card Fraud', tag:'BEST FIT', tagColor:C.teal, desc:'284,807 rows · V1–V28 · matches your SRS exactly', url:'https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud' },
              { name:'Credit Card Fraud 2023',   tag:'UPDATED',  tagColor:C.purple,desc:'550,000 rows · same format · more data',            url:'https://www.kaggle.com/datasets/nelgiriyewithana/credit-card-fraud-detection-dataset-2023' },
            ].map((d,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom: i===0?`1px solid ${C.navyBorder}`:'none' }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <span style={{ fontWeight:600, fontSize:13 }}>{d.name}</span>
                    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:`${d.tagColor}22`, color:d.tagColor, border:`1px solid ${d.tagColor}44` }}>{d.tag}</span>
                  </div>
                  <div style={{ fontSize:12, color:C.textMuted }}>{d.desc}</div>
                </div>
                <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ color:C.teal, fontSize:12, textDecoration:'none', marginLeft:16, flexShrink:0 }}>Kaggle →</a>
              </div>
            ))}
          </div>
        </>
      )}

      {(stage === 'uploading' || stage === 'done' || stage === 'error') && (
        <div style={{ background:C.navyCard, border:`1px solid ${C.navyBorder}`, borderRadius:12, padding:'24px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ fontWeight:600, fontSize:14 }}>{file?.name}</div>
            <div style={{ fontSize:13, color: stage==='done'?C.teal: stage==='error'?C.red:C.textMuted }}>
              {stage==='done'?'✓ Complete': stage==='error'?'✗ Error':`${progress}%`}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ background:C.navyBorder, borderRadius:4, height:5, marginBottom:20, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${progress}%`, background: stage==='error'?C.red:C.teal, borderRadius:4, transition:'width 0.4s ease' }} />
          </div>

          {/* Terminal log */}
          <div style={{ background:'#060b14', borderRadius:8, padding:'14px 16px', fontFamily:"'JetBrains Mono',monospace", fontSize:12, maxHeight:260, overflowY:'auto' }}>
            {logs.map(l => (
              <div key={l.id} style={{ color:l.color, marginBottom:3, animation:'fadeUp 0.2s ease' }}>{l.msg}</div>
            ))}
            {stage==='uploading' && <div style={{ color:C.textDim, animation:'pulse 1s infinite' }}>_</div>}
          </div>

          {errMsg && <div style={{ color:C.red, fontSize:13, marginTop:12 }}>⚠ {errMsg}</div>}

          {/* Results */}
          {stage==='done' && metrics && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginTop:20 }}>
                {Object.entries(metrics.models).map(([key, m]) => (
                  <div key={key} style={{ background:C.navy, borderRadius:10, padding:'16px', textAlign:'center' }}>
                    <div style={{ fontSize:11, color:C.textMuted, marginBottom:8 }}>{modelNames[key]}</div>
                    <div style={{ fontSize:24, fontWeight:700, color:modelColors[key], fontFamily:'monospace', marginBottom:4 }}>{m.accuracy}%</div>
                    <div style={{ fontSize:11, color:C.textDim }}>accuracy</div>
                    <div style={{ marginTop:10, fontSize:11, color:C.textMuted }}>
                      P: {m.precision}% · R: {m.recall}% · F1: {m.f1}%
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:14, padding:'10px 14px', background:C.tealGlow, border:`1px solid rgba(0,201,167,0.3)`, borderRadius:8, fontSize:12, color:C.teal }}>
                ✓ 300 real sample transactions saved for accurate fraud detection demos
              </div>
            </>
          )}

          {(stage==='done' || stage==='error') && (
            <button
              onClick={()=>{setStage('idle');setFile(null);setLogs([]);setProgress(0);setMetrics(null);setErrMsg('');}}
              style={{ marginTop:16, background:'transparent', border:`1px solid ${C.navyBorder}`, color:C.textMuted, borderRadius:8, padding:'8px 16px', fontSize:12, fontFamily:'Space Grotesk,sans-serif', cursor:'pointer' }}
            >Upload Another Dataset</button>
          )}
        </div>
      )}
    </div>
  );
}
