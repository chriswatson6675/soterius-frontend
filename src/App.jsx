import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Results from './pages/Results';
import './App.css';

function ScanApp() {
  const [page,     setPage]     = useState('home');
  const [scanData, setScanData] = useState(null);

  function handleScanComplete(data) {
    setScanData(data);
    setPage('results');
  }

  function handleReset() {
    setScanData(null);
    setPage('home');
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <span className="app-logo">🔒 Soterius</span>
          <span className="app-tagline">GDPR Compliance Scanner</span>
        </div>
      </header>
      <main className="app-main">
        {page === 'home'    && <Home    onScanComplete={handleScanComplete} />}
        {page === 'results' && <Results data={scanData} onReset={handleReset} />}
      </main>
      <footer className="app-footer">
        <p>Soterius — Free GDPR compliance checks. No data stored.</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/"        element={<Landing />} />
      <Route path="/results" element={<Results />} />
      <Route path="/*"       element={<ScanApp />} />
    </Routes>
  );
}
