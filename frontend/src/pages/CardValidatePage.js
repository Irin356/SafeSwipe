import React, { useState } from 'react';
import axios from 'axios';
import { C, API } from '../theme';

function luhnCheckFE(num) {
  const digits = String(num).replace(/\D/g,'').split('').map(Number);
  if (digits.length < 13) return false;
  let sum = 0, even = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits[i];
    if (even) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    even = !even;
  }
  return sum % 10 === 0;
}

function formatCard(v) {
  return v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
}

function detectNetwork(n) {
  n = n.replace(/\s/g,'');
  if (/^4/.test(n))          return { name:'Visa',             color:'#1A1F71' };
  if (/^5[1-5]/.test(n))     return { name:'Mastercard',       color:'#EB001B' };
  if (/^3[47]/.test(n))      return { name:'Amex',             color:'#007BC1' };
  if (/^6011/.test(n))       return { name:'Discover',         color:'#FF6600' };
  return null;
}

export default function CardValidatePage() {
  const [cardNum, setCardNum] = useState('');
  const [expiry,  setExpiry]  = useState('');
  const [cvv,     setCvv]     = useState('');
  const [holder,  setHolder]  = useState('');
  const [flipped, setFlipped] = useState(false);
  const [result,  setResult]  = useState(null);

  const raw     = cardNum.replace(/\s/g,'');
  const isValid = luhnCheckFE(raw);
  const network = detectNetwork(cardNum);

  async function handleValidate() {
    try {
      const res = await axios.post(`${API}/validate-card`, { card_number: raw });
      setResult(res.data);
    } catch {
      // fallback to frontend check
      setResult({ valid: isValid, luhn_check: isValid, length_valid: raw.length>=13&&raw.length<=19, digit_count: raw.length, network: network?.name||'Unknown' });
    }
  }

  return (
    <div style={{ maxWidth:780, margin:'0 auto', padding:'36px 28px' }}>
      <h2 style={{ fontSize:26, fontWeight:700, marginBottom:6, letterSpacing:'-0.5px' }}>Card Validation</h2>
      <p style={{ color:C.textMuted, fontSize:13, marginBottom:36 }}>Luhn algorithm validation — detects invalid or fake card numbers instantly without any ML.</p>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:28 }}>

        {/* Card visual */}
        <div>
          <div
            onClick={() => setFlipped(f => !f)}
            style={{
              background:'linear-gradient(135deg,#162040 0%,#0d1628 100%)',
              border:`1px solid ${C.navyBorder}`,
              borderRadius:18, padding:28, marginBottom:20,
              cursor:'pointer', position:'relative', overflow:'hidden', minHeight:180,
            }}
          >
            <div style={{ position:'absolute', top:-50, right:-40, width:180, height:180, borderRadius:'50%', background:'rgba(0,201,167,0.05)' }} />
            {!flipped ? (
              <>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:22 }}>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', letterSpacing:1.5 }}>CREDIT CARD</div>
                  {network && <div style={{ fontSize:12, fontWeight:700, color:C.teal }}>{network.name}</div>}
                </div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:19, letterSpacing:3, color: cardNum ? C.white : 'rgba(255,255,255,0.18)', marginBottom:20, wordBreak:'break-all' }}>
                  {cardNum || '•••• •••• •••• ••••'}
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                  <div>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:1, marginBottom:2 }}>CARD HOLDER</div>
                    <div style={{ fontSize:13, color: holder ? C.white : 'rgba(255,255,255,0.25)' }}>{holder||'YOUR NAME'}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:1, marginBottom:2 }}>EXPIRES</div>
                    <div style={{ fontSize:13, color: expiry ? C.white : 'rgba(255,255,255,0.25)', fontFamily:'monospace' }}>{expiry||'MM/YY'}</div>
                  </div>
                  {raw.length >= 13 && (
                    <div style={{ width:28, height:28, borderRadius:'50%', background: isValid ? C.teal : C.red, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color: isValid ? C.navy : C.white }}>
                      {isValid ? '✓' : '✗'}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div style={{ background:'rgba(0,0,0,0.45)', height:36, margin:'8px -28px 20px' }} />
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ flex:1, background:'rgba(255,255,255,0.08)', height:38, borderRadius:4 }} />
                  <div style={{ background:'rgba(255,255,255,0.12)', borderRadius:4, padding:'8px 14px', fontFamily:'monospace', color:C.white, minWidth:52, textAlign:'center' }}>
                    {cvv || 'CVV'}
                  </div>
                </div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', marginTop:10, textAlign:'right' }}>Click to flip back</div>
              </>
            )}
          </div>
          <p style={{ fontSize:11, color:C.textDim, textAlign:'center' }}>
            Try valid: 4532015112830366 · Try invalid: 1234567890123456
          </p>
        </div>

        {/* Form */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ fontSize:12, color:C.textMuted, marginBottom:6, display:'block' }}>Card Number *</label>
            <input
              value={cardNum}
              onChange={e => setCardNum(formatCard(e.target.value))}
              placeholder="1234 5678 9012 3456"
              style={{ fontFamily:"'JetBrains Mono',monospace", letterSpacing:2, borderColor: raw.length>=13 ? (isValid?C.teal:C.red) : C.navyBorder }}
            />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={{ fontSize:12, color:C.textMuted, marginBottom:6, display:'block' }}>Expiry</label>
              <input value={expiry} onChange={e=>setExpiry(e.target.value.replace(/[^0-9/]/g,'').slice(0,5))} placeholder="MM/YY" />
            </div>
            <div>
              <label style={{ fontSize:12, color:C.textMuted, marginBottom:6, display:'block' }}>CVV</label>
              <input value={cvv} onChange={e=>setCvv(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="123" type="password"
                onFocus={()=>setFlipped(true)} onBlur={()=>setFlipped(false)} />
            </div>
          </div>
          <div>
            <label style={{ fontSize:12, color:C.textMuted, marginBottom:6, display:'block' }}>Card Holder</label>
            <input value={holder} onChange={e=>setHolder(e.target.value.toUpperCase())} placeholder="JOHN DOE" />
          </div>

          <button
            onClick={handleValidate}
            disabled={!raw}
            style={{
              background: raw ? C.teal : C.navyBorder,
              color: raw ? C.navy : C.textMuted,
              border:'none', borderRadius:10, padding:'13px',
              fontWeight:700, fontSize:14, fontFamily:'Space Grotesk,sans-serif',
              cursor: raw ? 'pointer' : 'not-allowed', marginTop:6,
            }}
          >Validate Card</button>

          {result && (
            <div className="anim" style={{
              background: result.valid ? C.tealGlow : C.redGlow,
              border:`1px solid ${result.valid ? 'rgba(0,201,167,0.4)' : 'rgba(255,77,106,0.4)'}`,
              borderRadius:10, padding:'16px',
            }}>
              <div style={{ fontWeight:700, color: result.valid ? C.teal : C.red, marginBottom:12, fontSize:15 }}>
                {result.valid ? '✓ Card is VALID' : '✗ Card is INVALID'}
              </div>
              {[
                { label:'Luhn Check',    val: result.luhn_check   ? '✓ PASS' : '✗ FAIL', c: result.luhn_check   ? C.teal : C.red },
                { label:'Length Valid',  val: result.length_valid ? '✓ PASS' : '✗ FAIL', c: result.length_valid ? C.teal : C.red },
                { label:'Network',       val: result.network,                              c: C.text },
                { label:'Digit Count',   val: result.digit_count,                          c: C.text },
              ].map(r => (
                <div key={r.label} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6 }}>
                  <span style={{ color:C.textMuted }}>{r.label}</span>
                  <span style={{ fontFamily:'monospace', color:r.c }}>{r.val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      <div style={{ marginTop:36, background:C.navyCard, border:`1px solid ${C.navyBorder}`, borderRadius:12, padding:'22px' }}>
        <div style={{ fontWeight:600, marginBottom:14, fontSize:14 }}>How Luhn Algorithm Works</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:14 }}>
          {[
            { s:'1', t:'Start from rightmost digit (the check digit)' },
            { s:'2', t:'Double every second digit from the right' },
            { s:'3', t:'Subtract 9 if the doubled result exceeds 9' },
            { s:'4', t:'Sum all digits — if divisible by 10: VALID' },
          ].map(s => (
            <div key={s.s} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <div style={{ width:22, height:22, borderRadius:'50%', background:C.tealGlow, border:`1px solid rgba(0,201,167,0.3)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:C.teal, flexShrink:0 }}>{s.s}</div>
              <div style={{ fontSize:12, color:C.textMuted, lineHeight:1.55 }}>{s.t}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
