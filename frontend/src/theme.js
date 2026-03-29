export const C = {
  navy:       '#0A0F1E',
  navyLight:  '#111827',
  navyCard:   '#141C2F',
  navyBorder: '#1E2D4A',
  teal:       '#00F0FF',
  tealDim:    '#00C2D0',
  tealGlow:   'rgba(0,240,255,0.18)',
  red:        '#FF4D6A',
  redGlow:    'rgba(255,77,106,0.12)',
  amber:      '#FFBB33',
  purple:     '#A78BFA',
  text:       '#E8EDF5',
  textMuted:  '#D8E7FF',
  textDim:    '#B9D1F6',
  white:      '#FFFFFF',
};

export const API = 'http://localhost:5000';

export const GLOBAL_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 100%;
    min-height: 100%;
    background: ${C.navy} url('/crdimg14.jpg') no-repeat center center fixed !important;
    background-size: cover !important;
    color: ${C.text};
    font-family: 'Space Grotesk', sans-serif;
  }
  body {
    min-height: 100vh;
  }
  @keyframes fadeUp   { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes spin     { to { transform:rotate(360deg); } }
  @keyframes glow     { 0%,100%{box-shadow:0 0 10px rgba(0,201,167,0.25)} 50%{box-shadow:0 0 24px rgba(0,201,167,0.55)} }
  @keyframes barFill  { from{width:0} }

  .anim { animation: fadeUp 0.35s ease both; }

  h1, h2, h3, h4, h5, h6 {
    color: #FFFFFF !important;
    text-shadow: 0 1px 8px rgba(0,0,0,0.45);
  }

  hr {
    border: 0;
    height: 1px;
    background: rgba(255,255,255,0.5);
    margin: 1rem 0;
  }

  .heading, .section-title {
    color: #FFFFFF !important;
    text-shadow: 0 1px 8px rgba(0,0,0,0.45);
  }

  input, select {
    background: ${C.navyCard};
    border: 1px solid ${C.navyBorder};
    color: ${C.text};
    font-family: 'Space Grotesk', sans-serif;
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
    width: 100%;
  }
  input:focus, select:focus { border-color: ${C.teal}; }
  input::placeholder { color: ${C.textDim}; }

  ::-webkit-scrollbar       { width: 4px; }
  ::-webkit-scrollbar-track { background: ${C.navy}; }
  ::-webkit-scrollbar-thumb { background: ${C.navyBorder}; border-radius: 4px; }
`;
