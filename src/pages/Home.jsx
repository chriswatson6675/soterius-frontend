import { useState } from 'react';
import ScanForm from '../components/ScanForm';
import ProgressBar from '../components/ProgressBar';
import { scanDomain } from '../services/api';
import './Home.css';

const STEPS = [
  { icon: '🔍', title: 'Enter your domain', desc: 'Type in your website address — no sign-up required.' },
  { icon: '⚡', title: 'Instant scan', desc: '7 scanners run in parallel: SSL, headers, DNS, ports, subdomains, tech, GDPR.' },
  { icon: '📊', title: 'Get your report', desc: 'See your compliance score, risk level, and exactly what to fix.' },
];

const FAQS = [
  {
    q: 'Is this free?',
    a: 'Yes, completely free. No account needed, no credit card, no limits.',
  },
  {
    q: 'Do you store my scan results?',
    a: 'No. All scans are ephemeral — results exist only in your browser session and are never saved to a database.',
  },
  {
    q: 'What does the GDPR scanner check?',
    a: 'It checks for a privacy policy, cookie consent banner, tracking scripts without consent, and data subject rights information.',
  },
  {
    q: 'How accurate is the port scanner?',
    a: 'It performs a direct TCP connection check on 8 common ports. Firewalled ports will show as closed even if a service runs behind them.',
  },
  {
    q: 'Can I scan any domain?',
    a: 'Any public domain. localhost, private IPs, and internal hostnames are blocked for security.',
  },
];

export default function Home({ onScanComplete }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(domain) {
    setError('');
    setScanning(true);
    try {
      const data = await scanDomain(domain);
      onScanComplete(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="home">
      <section className="hero" aria-label="Scanner hero">
        <div className="hero-inner">
          <h1 className="hero-title">Free GDPR Compliance Check</h1>
          <p className="hero-sub">
            Scan any website for security issues and GDPR compliance in seconds.
            No sign-up. No data stored.
          </p>

          <ScanForm onSubmit={handleSubmit} disabled={scanning} />
          {error && <p className="home-error" role="alert">{error}</p>}
          {scanning && <ProgressBar />}
        </div>
      </section>

      <section className="steps" aria-label="How it works">
        <div className="steps-inner">
          <h2 className="section-title">How it works</h2>
          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <div className="step-card" key={i}>
                <span className="step-icon" aria-hidden="true">{s.icon}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="faq" aria-label="FAQ">
        <div className="faq-inner">
          <h2 className="section-title">Frequently asked questions</h2>
          <div className="faq-list">
            {FAQS.map((item, i) => (
              <details className="faq-item" key={i}>
                <summary className="faq-q">{item.q}</summary>
                <p className="faq-a">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
