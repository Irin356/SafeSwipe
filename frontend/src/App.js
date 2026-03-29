import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GLOBAL_CSS, API } from './theme';
import NavBar from './components/NavBar';
import HomePage from './pages/HomePage';
import FraudDetectPage from './pages/FraudDetectPage';
import CardValidatePage from './pages/CardValidatePage';
import UploadPage from './pages/UploadPage';
import DashboardPage from './pages/DashboardPage';
import ModelsPage from './pages/ModelsPage';
import AdminAuthPage from './pages/AdminAuthPage';

export default function App() {
  const [page, setPage] = useState('home');
  const [trained, setTrained] = useState(false);
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    axios.get(`${API}/health`)
      .then(r => setTrained(r.data.models_trained))
      .catch(() => {});

    const token = localStorage.getItem('adminToken');
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      axios.get(`${API}/admin-check`)
        .then(res => {
          if (res.data.authenticated) {
            setAdmin({ username: res.data.username, token });
          } else {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUsername');
          }
        })
        .catch(() => {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUsername');
          delete axios.defaults.headers.common.Authorization;
        });
    }
  }, []);

  const onAuthSuccess = (user) => {
    setAdmin(user);
    setTrained(true);
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/admin-logout`);
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    delete axios.defaults.headers.common.Authorization;
    setAdmin(null);
  };

  const pages = {
    home: <HomePage setPage={setPage} />,
    detect: <FraudDetectPage />,
    validate: <CardValidatePage />,
    upload: <UploadPage onTrained={() => setTrained(true)} />,
    dashboard: <DashboardPage />,
    models: <ModelsPage />,
  };

  if (!admin) {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <AdminAuthPage onAuthSuccess={onAuthSuccess} />
      </>
    );
  }

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <NavBar page={page} setPage={setPage} trained={trained} admin={admin} onLogout={logout} />
      <main>
        {pages[page] || <HomePage setPage={setPage} />}
      </main>
    </>
  );
}
