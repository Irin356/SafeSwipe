import React from 'react';
import { C } from '../theme';

const LINKS = [
  { id: 'home',     label: 'Home' },
  { id: 'detect',   label: 'Fraud Detection' },
  { id: 'validate', label: 'Card Validator' },
  { id: 'upload',   label: 'Upload Dataset' },
  { id: 'dashboard',label: 'Dashboard' },
  { id: 'models',   label: 'ML Models' },
];

export default function NavBar({ page, setPage, trained, admin, onLogout }) {
  return (
    <nav style={{
      background: C.navyCard,
      borderBottom: `1px solid ${C.navyBorder}`,
      padding: '0 28px',
      display: 'flex',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div
        style={{ display:'flex', alignItems:'center', gap:10, marginRight:36, padding:'14px 0', flexShrink:0 }}
      >
        <div style={{
          width:32, height:32, borderRadius:8,
          background: C.teal, display:'flex', alignItems:'center',
          justifyContent:'center', animation:'glow 3s infinite',
        }}>
          <span style={{ color: C.navy, fontWeight:700, fontSize:13 }}>SS</span>
        </div>
        <span style={{ fontWeight:700, fontSize:17, letterSpacing:'-0.5px' }}>
          Safe<span style={{ color: C.teal }}>Swipe</span>
        </span>
      </div>

      {/* Nav links */}
      <div style={{ display:'flex', gap:2, flex:1, overflowX:'auto' }}>
        {LINKS.map(l => (
          <button
            key={l.id}
            onClick={() => setPage(l.id)}
            style={{
              background: 'none',
              border: 'none',
              color: page === l.id ? C.teal : C.textMuted,
              padding: '17px 13px',
              fontSize: 13,
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: page === l.id ? 600 : 400,
              borderBottom: page === l.id ? `2px solid ${C.teal}` : '2px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'color 0.2s',
            }}
          >{l.label}</button>
        ))}
      </div>

      {/* Status */}
      <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0, paddingLeft:16 }}>
        <div style={{
          width:7, height:7, borderRadius:'50%',
          background: trained ? C.teal : C.amber,
          animation: 'pulse 2s infinite',
        }} />
        <span style={{ fontSize:12, color: trained ? C.teal : C.amber, whiteSpace:'nowrap' }}>
          {trained ? 'Models Ready' : 'Not Trained'}
        </span>
      </div>
      {admin && (
        <div style={{ display:'flex', alignItems:'center', gap:10, marginLeft:14, flexShrink:0 }}>
          <span style={{ fontSize:12, color: C.textMuted }}>Admin: {admin.username}</span>
          <button
            onClick={onLogout}
            style={{
              background:'none', border:'1px solid #3B4B73', color:C.textMuted,
              padding:'6px 10px', borderRadius:8, cursor:'pointer', fontSize:11
            }}
          >Logout</button>
        </div>
      )}
    </nav>
  );
}
