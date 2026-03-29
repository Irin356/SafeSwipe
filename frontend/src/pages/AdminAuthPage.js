import React, { useState } from 'react';
import axios from 'axios';
import { C, API } from '../theme';

export default function AdminAuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // login or signup
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!username.trim() || !password) {
      setError('Username and password are required');
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === 'signup' ? '/admin-signup' : '/admin-login';
      const response = await axios.post(`${API}${endpoint}`, { username: username.trim(), password });

      if (mode === 'signup') {
        setMessage('Admin created successfully. Please log in.');
        setMode('login');
        setPassword('');
        setLoading(false);
        return;
      }

      const token = response.data.token;
      if (!token) {
        setError('Login failed: token not returned');
      } else {
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminUsername', username.trim());
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;
        onAuthSuccess({ username: username.trim(), token });
      }
    } catch (e) {
      const backend = e.response?.data?.error || e.message;
      setError(backend);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '80px auto', padding: '36px 24px', borderRadius: 12, background: C.navyCard, border: `1px solid ${C.navyBorder}` }}>
      <h2 style={{ marginBottom: 12, color: C.teal }}>{mode === 'signup' ? 'Admin Sign Up' : 'Admin Login'}</h2>
      <p style={{ color: C.textMuted, marginBottom: 16, fontSize: 13 }}>
        {mode === 'signup'
          ? 'Create first admin account. Only one admin account is allowed.'
          : 'Enter your admin credentials to access the dashboard.'}
      </p>

      <form onSubmit={submit}> 
        <label style={{ display: 'block', marginBottom: 10 }}>
          <div style={{ marginBottom: 4, fontSize: 12, color: C.textMuted }}>Username</div>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            autoComplete="username"
          />
        </label>

        <label style={{ display: 'block', marginBottom: 16 }}>
          <div style={{ marginBottom: 4, fontSize: 12, color: C.textMuted }}>Password</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
        </label>

        {error && <div style={{ color: C.red, marginBottom: 8, fontSize: 13 }}>{error}</div>}
        {message && <div style={{ color: C.teal, marginBottom: 8, fontSize: 13 }}>{message}</div>}

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid', background: loading ? '#0f1c33' : C.teal, color: C.navy, fontWeight: 700, cursor: 'pointer' }}
        >
          {loading ? 'Please wait…' : mode === 'signup' ? 'Create Admin' : 'Login'}
        </button>
      </form>

      <div style={{ marginTop: 14, textAlign: 'center', fontSize: 13, color: C.textMuted }}>
        {mode === 'signup'
          ? <>Already an admin? <button onClick={() => setMode('login')} style={{ color: C.teal, background: 'none', border: 'none', cursor: 'pointer' }}>Login</button></>
          : <>Need an admin account? <button onClick={() => setMode('signup')} style={{ color: C.teal, background: 'none', border: 'none', cursor: 'pointer' }}>Sign Up</button></>}
      </div>
    </div>
  );
}
