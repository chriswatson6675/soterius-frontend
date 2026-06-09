import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { scanDomain, submitGate } from '../services/api';
import ScannerCard from '../components/ScannerCard';

// ─── Constants ────────────────────────────────────────────────────────────────

const CONCERNS    = ['SSL/TLS Security', 'GDPR Compliance', 'SRA Compliance', 'Phishing Risk'];
const IT_MGMT_OPT = ['In-house', 'Outsourced', 'Hybrid', 'No formal process'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRiskKey(score) {
  if (score >= 80) return 'low';
  if (score >= 50) return 'medium';
  return 'critical';
}

function getRiskLabel(score) {
  if (score >= 80) return 'Low Risk';
  if (score >= 50) return 'Medium Risk';
  return 'Critical Risk';
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '';
  }
}

// ─── Shared layout ────────────────────────────────────────────────────────────

function Topbar() {
  return (
    <div className="rp-topbar" role="banner">
      <span className="rp-brand">Soterius</span>
    </div>
  );
}

function PageFooter() {
  return (
    <footer className="rp-footer">
      <ul className="rp-footer-links">
        <li><a href="/privacy">Privacy Policy</a></li>
        <li aria-hidden="true" className="rp-footer-sep">|</li>
        <li><a href="/terms">Terms of Service</a></li>
        <li aria-hidden="true" className="rp-footer-sep">|</li>
        <li><a href="/contact">Contact</a></li>
      </ul>
      <p className="rp-footer-copy">© 2026 Soterius</p>
    </footer>
  );
}

// ─── Loading / error views ────────────────────────────────────────────────────

function Loading({ domain }) {
  return (
    <div className="rp">
      <style>{css}</style>
      <Topbar />
      <div className="rp-center">
        <div className="rp-state-box" role="status" aria-live="polite">
          <div className="rp-state-icon" aria-hidden="true">🔍</div>
          <h2>Scanning {domain}</h2>
          <p>Running 6 security checks. This usually takes 30–60 seconds.</p>
        </div>
      </div>
      <PageFooter />
    </div>
  );
}

function ErrorView({ domain, message, onRetry, autoRetry }) {
  const navigate    = useNavigate();
  const onRetryRef  = useRef(onRetry);
  onRetryRef.current = onRetry;

  const [countdown, setCountdown] = useState(autoRetry ? 15 : null);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) { onRetryRef.current(); return; }
    const id = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  function handleRetryNow() {
    setCountdown(null);
    onRetryRef.current();
  }

  return (
    <div className="rp">
      <style>{css}</style>
      <Topbar />
      <div className="rp-center">
        <div className="rp-state-box">
          <div className="rp-state-icon" aria-hidden="true">⚠️</div>
          <h2>Scan failed</h2>
          <p>{message || `Could not scan ${domain}. Please try again.`}</p>
          {countdown !== null && (
            <p className="rp-retry-countdown" aria-live="polite">
              Retrying in {countdown}s…
            </p>
          )}
          <div className="rp-state-actions">
            <button className="btn btn-secondary" onClick={() => navigate('/')}>← Back</button>
            <button className="btn btn-primary" onClick={handleRetryNow}>
              {countdown !== null ? 'Try Now' : 'Try Again'}
            </button>
          </div>
        </div>
      </div>
      <PageFooter />
    </div>
  );
}

// ─── Score gauge (SVG semicircle, gradient) ───────────────────────────────────

function ScoreGauge({ score }) {
  const cx = 100, cy = 105, r = 78, sw = 16;

  function toXY(deg) {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }

  const [sx, sy] = toXY(180); // left endpoint  (22, 105)
  const [ex, ey] = toXY(0);   // right endpoint (178, 105)

  const bgPath     = `M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`;
  const scoreAngle = 180 + (score / 100) * 180;
  const [nx, ny]   = toXY(scoreAngle);
  const scorePath  = score > 0
    ? `M ${sx} ${sy} A ${r} ${r} 0 0 1 ${nx} ${ny}`
    : null;

  // Interpolate a color from the gradient stops at an arbitrary fraction 0–1.
  // The gradient maps linearly in x-space: 0%=red, 50%=amber, 100%=green.
  // The dot's x-position relative to [sx, ex] gives its gradient fraction.
  function lerpHex(a, b, t) {
    const p = s => [parseInt(s.slice(1,3),16), parseInt(s.slice(3,5),16), parseInt(s.slice(5,7),16)];
    const [ar,ag,ab] = p(a), [br,bg,bb] = p(b);
    return `rgb(${Math.round(ar+(br-ar)*t)},${Math.round(ag+(bg-ag)*t)},${Math.round(ab+(bb-ab)*t)})`;
  }

  const gradFrac = (nx - sx) / (ex - sx); // 0→1, tracks the gradient x-stops
  const dotColor = gradFrac <= 0.5
    ? lerpHex('#dc2626', '#f59e0b', gradFrac / 0.5)
    : lerpHex('#f59e0b', '#10b981', (gradFrac - 0.5) / 0.5);
  const textColor = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#dc2626';

  return (
    <svg
      viewBox="0 0 200 130"
      role="img"
      aria-label={`Security score: ${score}%`}
      style={{ width: '100%', maxWidth: 200, display: 'block', margin: '0 auto' }}
    >
      <defs>
        {/* Horizontal gradient mapped to arc endpoints in user-space coords */}
        <linearGradient id="gauge-grad" gradientUnits="userSpaceOnUse"
          x1={sx} y1={sy} x2={ex} y2={sy}>
          <stop offset="0%"   stopColor="#dc2626" />
          <stop offset="50%"  stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>

      {/* Full arc — gradient at low opacity = the "unfilled" track */}
      <path d={bgPath} fill="none" stroke="url(#gauge-grad)" strokeWidth={sw}
        strokeLinecap="butt" opacity="0.22" />

      {/* Score arc — same gradient at full opacity, overlaid on top */}
      {scorePath && (
        <path d={scorePath} fill="none" stroke="url(#gauge-grad)" strokeWidth={sw}
          strokeLinecap="butt" />
      )}

      {/* Endpoint cap dot */}
      {score > 0 && score < 100 && (
        <circle cx={nx} cy={ny} r={sw / 2} fill={dotColor} />
      )}

      {/* Score percentage */}
      <text x={cx} y={86} textAnchor="middle" dominantBaseline="middle"
        fontSize="34" fontWeight="700" fill={textColor} fontFamily="inherit">
        {score}%
      </text>

      {/* Subtitle */}
      <text x={cx} y={112} textAnchor="middle" fontSize="11" fill="#9ca3af" fontFamily="inherit">
        Security Score
      </text>

      {/* Zone end-labels */}
      <text x={20} y={124} fontSize="9" fontWeight="600" fill="#dc2626" fontFamily="inherit">HIGH RISK</text>
      <text x={180} y={124} fontSize="9" fontWeight="600" fill="#10b981" fontFamily="inherit" textAnchor="end">LOW RISK</text>
    </svg>
  );
}

// ─── Score card ───────────────────────────────────────────────────────────────

function ScoreCard({ score, scanners }) {
  const riskKey     = getRiskKey(score);
  const riskLabel   = getRiskLabel(score);
  const totalChecks = scanners.reduce((sum, s) => sum + s.checks.length, 0);
  const issueCount  = scanners.reduce((sum, s) => sum + s.checks.filter(c => c.status !== 'PASS').length, 0);
  const summary     = issueCount === 0
    ? 'All checks passed'
    : `${issueCount} of ${totalChecks} checks need attention`;

  return (
    <div className="rp-score-card" role="region" aria-label="Overall security score">
      <div className="rp-gauge-wrap">
        <ScoreGauge score={score} />
      </div>
      <div className="rp-score-info">
        <span className={`rp-risk-badge rp-risk-${riskKey}`} role="status">{riskLabel}</span>
        <p className="rp-issue-summary">{summary}</p>
      </div>
    </div>
  );
}

// ─── Gate modal ───────────────────────────────────────────────────────────────

function GateModal({ domain, scanScore, scanResults, onSuccess, onClose }) {
  const [fields, setFields] = useState({
    name: '', email: '', firmName: '',
    mainConcern:   CONCERNS[0],
    itManagement:  IT_MGMT_OPT[0],
    dataIncidents: false,
    confidence:    3,
  });
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState('');

  function set(key, value) {
    setFields(prev => ({ ...prev, [key]: value }));
    if (error) setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    console.log('[GATE] handleSubmit fired');
    console.log('[GATE] API URL:', import.meta.env.VITE_API_URL || 'NOT SET — falling back to localhost');
    console.log('[GATE] Payload domain:', domain, '| email:', fields.email);
    setBusy(true);
    setError('');
    try {
      console.log('[GATE] Calling submitGate...');
      const result = await submitGate({ domain, scanScore, scanResults, ...fields });
      console.log('[GATE] Success:', result);
      onSuccess(fields.email.trim());
    } catch (err) {
      console.error('[GATE] Error:', err);
      setError(err.message || 'Submission failed. Please try again.');
      setBusy(false);
    }
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') onClose();
  }

  return (
    <div
      className="rp-modal-overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-title"
    >
      <div className="rp-modal">
        <button
          className="rp-modal-close"
          onClick={onClose}
          aria-label="Close"
          type="button"
        >✕</button>

        <h2 id="gate-title" className="rp-modal-title">Unlock Your Security Report</h2>
        <p className="rp-modal-sub">
          We'll email your full report with specific recommendations for {domain}.
        </p>

        <form onSubmit={handleSubmit} noValidate>

          <div className="rp-modal-row2">
            <div className="rp-field">
              <label className="rp-label" htmlFor="gate-name">Your name</label>
              <input
                id="gate-name"
                className="rp-input"
                type="text"
                value={fields.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Jane Smith"
                autoFocus
              />
            </div>
            <div className="rp-field">
              <label className="rp-label" htmlFor="gate-email">
                Email address <span className="rp-required" aria-hidden="true">*</span>
              </label>
              <input
                id="gate-email"
                className="rp-input"
                type="email"
                value={fields.email}
                onChange={e => set('email', e.target.value)}
                placeholder="jane@yourfirm.co.uk"
                required
              />
            </div>
          </div>

          <div className="rp-field">
            <label className="rp-label" htmlFor="gate-firm">Firm / practice name</label>
            <input
              id="gate-firm"
              className="rp-input"
              type="text"
              value={fields.firmName}
              onChange={e => set('firmName', e.target.value)}
              placeholder="Smith &amp; Partners LLP"
            />
          </div>

          <div className="rp-modal-row2">
            <div className="rp-field">
              <label className="rp-label" htmlFor="gate-concern">Main concern</label>
              <select
                id="gate-concern"
                className="rp-input rp-select"
                value={fields.mainConcern}
                onChange={e => set('mainConcern', e.target.value)}
              >
                {CONCERNS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="rp-field">
              <label className="rp-label" htmlFor="gate-it">IT management</label>
              <select
                id="gate-it"
                className="rp-input rp-select"
                value={fields.itManagement}
                onChange={e => set('itManagement', e.target.value)}
              >
                {IT_MGMT_OPT.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <div className="rp-field">
            <label className="rp-checkbox-label">
              <input
                type="checkbox"
                className="rp-checkbox"
                checked={fields.dataIncidents}
                onChange={e => set('dataIncidents', e.target.checked)}
              />
              We've had data incidents or breaches in the past
            </label>
          </div>

          <fieldset className="rp-field rp-fieldset">
            <legend className="rp-label">
              Compliance confidence&ensp;
              <span className="rp-label-hint">(1 = not at all, 5 = very)</span>
            </legend>
            <div className="rp-confidence" role="group">
              {[1, 2, 3, 4, 5].map(n => (
                <label
                  key={n}
                  className={`rp-conf-opt${fields.confidence === n ? ' rp-conf-opt--on' : ''}`}
                >
                  <input
                    type="radio"
                    name="gate-confidence"
                    value={n}
                    checked={fields.confidence === n}
                    onChange={() => set('confidence', n)}
                    className="rp-sr-only"
                  />
                  {n}
                </label>
              ))}
            </div>
          </fieldset>

          {error && (
            <p className="rp-field-error" role="alert">{error}</p>
          )}

          <button
            className="btn btn-primary rp-modal-submit"
            type="submit"
            disabled={busy}
          >
            {busy ? 'Sending…' : 'Send Report & Get Full Results'}
          </button>

          <p className="rp-modal-small">
            No spam. We'll only contact you about your security report.
          </p>
        </form>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }) {
  // Use a ref so the timeout always calls the latest onDismiss
  // without making it a useEffect dependency (avoids re-triggering on re-renders).
  const cbRef = useRef(onDismiss);
  cbRef.current = onDismiss;

  useEffect(() => {
    const id = setTimeout(() => cbRef.current(), 4500);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="rp-toast" role="status" aria-live="polite">
      <span className="rp-toast-check" aria-hidden="true">✓</span>
      {message}
    </div>
  );
}

// ─── Full results view ────────────────────────────────────────────────────────

function ResultsView({ data, onBack }) {
  const score    = data.score;
  const scanDate = formatDate(data.scannedAt);

  const [gateOpen,   setGateOpen]   = useState(false);
  const [gatePassed, setGatePassed] = useState(false);
  const [toast,      setToast]      = useState('');

  function handleGateSuccess(email) {
    setGateOpen(false);
    setGatePassed(true);
    setToast(`Report sent to ${email}! Check your inbox.`);
  }

  return (
    <div className="rp">
      <style>{css}</style>
      <Topbar />

      <main className="rp-content">

        {/* ── Page header ── */}
        <div className="rp-header">
          <div className="rp-header-meta">
            <h1>Results for {data.domain}</h1>
            {scanDate && <p>Scanned on {scanDate}</p>}
          </div>
          <button
            className="btn btn-secondary"
            onClick={onBack}
            aria-label="Scan another domain"
          >
            ← Scan Another Domain
          </button>
        </div>

        {/* ── Score card — always visible ── */}
        <ScoreCard score={score} scanners={data.scanners || []} />

        {/* ── Scanner grid — blurred until gate passes ── */}
        <div className={`rp-grid-wrap${gatePassed ? '' : ' rp-grid-locked'}`}>
          <div className="rp-grid" role="list" aria-label="Scanner results">
            {(data.scanners || []).map(scanner => (
              <ScannerCard
                key={scanner.name}
                name={scanner.name}
                score={scanner.score}
                checks={scanner.checks}
              />
            ))}
          </div>

          {!gatePassed && (
            <div className="rp-gate-overlay" aria-label="Unlock full report">
              <div className="rp-gate-box">
                <div className="rp-gate-icon" aria-hidden="true">🔒</div>
                <h3 className="rp-gate-title">Your report is ready</h3>
                <p className="rp-gate-desc">
                  Enter your details to unlock the full findings with
                  actionable recommendations for each check.
                </p>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => setGateOpen(true)}
                >
                  View Full Report →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── CTA — changes after gate ── */}
        {gatePassed ? (
          <div className="rp-cta">
            <h2>Want expert help fixing these issues?</h2>
            <p className="rp-cta-desc">
              Our team can remediate every finding, produce written evidence for SRA/FCA
              inspections, and manage ongoing compliance monitoring.
            </p>
            <div className="rp-cta-buttons">
              <button className="btn btn-primary"   type="button">Get Full Report (£399)</button>
              <button className="btn btn-secondary" type="button">Book 30-Min Call</button>
            </div>
          </div>
        ) : (
          <div className="rp-cta">
            <h2>What's in your full report?</h2>
            <p className="rp-cta-desc">
              Detailed findings for every check, fix guides tailored to your tech stack,
              and compliance evidence for SRA, FCA, and ICAEW audits.
            </p>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => setGateOpen(true)}
            >
              View Full Report →
            </button>
          </div>
        )}

      </main>

      <PageFooter />

      {gateOpen && (
        <GateModal
          domain={data.domain}
          scanScore={score}
          scanResults={data.scanners}
          onSuccess={handleGateSuccess}
          onClose={() => setGateOpen(false)}
        />
      )}

      {toast && (
        <Toast message={toast} onDismiss={() => setToast('')} />
      )}
    </div>
  );
}

// ─── Root: owns fetch lifecycle ───────────────────────────────────────────────

export default function Results() {
  const [searchParams]              = useSearchParams();
  const navigate                    = useNavigate();
  const domain                      = searchParams.get('domain');

  const [phase,      setPhase]      = useState('loading');
  const [data,       setData]       = useState(null);
  const [errMsg,     setErrMsg]     = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!domain?.trim()) { navigate('/'); return; }
    setPhase('loading');
    setErrMsg('');
    scanDomain(domain)
      .then(result => { setData(result); setPhase('ready'); })
      .catch(err   => { setErrMsg(err.message); setPhase('error'); });
  }, [domain, retryCount, navigate]);

  if (phase === 'loading') return <Loading domain={domain} />;
  if (phase === 'error')   return (
    <ErrorView
      domain={domain}
      message={errMsg}
      onRetry={() => setRetryCount(n => n + 1)}
      autoRetry={errMsg.includes('Cannot connect')}
    />
  );
  return <ResultsView data={data} onBack={() => navigate('/')} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const css = `
  .rp *, .rp *::before, .rp *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .rp {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--color-bg);
    color: var(--color-text);
    font-family: inherit;
    font-size: 16px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Topbar ──────────────────────────────────────────────── */
  .rp-topbar {
    height: 54px;
    flex-shrink: 0;
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    padding: 0 24px;
  }
  .rp-brand {
    font-size: 17px;
    font-weight: 700;
    color: var(--color-primary);
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }

  /* ── Loading / error ─────────────────────────────────────── */
  .rp-center {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
  }
  .rp-state-box {
    max-width: 460px;
    width: 100%;
    text-align: center;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    padding: 40px 32px;
  }
  .rp-state-icon  { font-size: 40px; line-height: 1; margin-bottom: 16px; }
  .rp-state-box h2 {
    font-size: 20px; font-weight: 600;
    color: var(--color-text); margin-bottom: 10px; word-break: break-all;
  }
  .rp-state-box p {
    font-size: 15px; color: var(--color-text-muted);
    line-height: 1.55; margin-bottom: 24px;
  }
  .rp-retry-countdown {
    font-size: 14px; color: var(--color-text-muted);
    margin-bottom: 0 !important;
  }
  .rp-state-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

  /* ── Content wrapper ─────────────────────────────────────── */
  .rp-content {
    flex: 1;
    max-width: 900px;
    width: 100%;
    margin: 0 auto;
    padding: 32px 24px 48px;
  }

  /* ── Page header ─────────────────────────────────────────── */
  .rp-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }
  .rp-header-meta h1 {
    font-size: 22px; font-weight: 600;
    color: var(--color-text); word-break: break-all; margin-bottom: 4px;
  }
  .rp-header-meta p { font-size: 14px; color: var(--color-text-muted); }

  /* ── Score card ──────────────────────────────────────────── */
  .rp-score-card {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 28px;
    flex-wrap: wrap;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    padding: 24px 28px;
    margin-bottom: 20px;
  }
  .rp-gauge-wrap { flex-shrink: 0; width: 200px; }
  .rp-score-info { flex: 1; min-width: 180px; display: flex; flex-direction: column; gap: 8px; }
  .rp-risk-badge {
    display: inline-block;
    width: fit-content;
    padding: 4px 12px;
    border-radius: 99px;
    font-size: 12px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .rp-risk-low      { color: var(--color-success); background: rgba(22,163,74,0.12); }
  .rp-risk-medium   { color: #ca8a04;              background: rgba(202,138,4,0.12); }
  .rp-risk-high     { color: #ea580c;              background: rgba(234,88,12,0.12); }
  .rp-risk-critical { color: var(--color-danger);  background: rgba(220,38,38,0.12); }
  .rp-issue-summary { font-size: 15px; color: var(--color-text-muted); line-height: 1.4; }

  /* ── Scanner grid + gate ─────────────────────────────────── */
  .rp-grid-wrap {
    position: relative;
    margin-bottom: 28px;
  }
  .rp-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }
  @media (min-width: 640px) {
    .rp-grid { grid-template-columns: repeat(2, 1fr); }
  }

  /* Blur the grid content when locked */
  .rp-grid-locked .rp-grid {
    filter: blur(6px);
    pointer-events: none;
    user-select: none;
  }

  /* Overlay sits on top of the blurred grid */
  .rp-gate-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: linear-gradient(
      to bottom,
      rgba(248,249,250,0.55) 0%,
      rgba(248,249,250,0.98) 45%
    );
    border-radius: var(--radius);
    z-index: 5;
  }
  .rp-gate-box {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    padding: 28px 32px;
    text-align: center;
    max-width: 400px;
    width: 100%;
  }
  .rp-gate-icon  { font-size: 36px; line-height: 1; margin-bottom: 12px; }
  .rp-gate-title { font-size: 18px; font-weight: 600; color: var(--color-text); margin-bottom: 8px; }
  .rp-gate-desc  {
    font-size: 14px; color: var(--color-text-muted);
    line-height: 1.5; margin-bottom: 18px;
  }

  /* ── CTA card ────────────────────────────────────────────── */
  .rp-cta {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    padding: 28px 32px;
    text-align: center;
  }
  .rp-cta h2     { font-size: 20px; font-weight: 600; color: var(--color-text); margin-bottom: 8px; }
  .rp-cta-desc   {
    font-size: 14px; color: var(--color-text-muted);
    line-height: 1.55; margin-bottom: 20px;
    max-width: 480px; margin-left: auto; margin-right: auto;
  }
  .rp-cta-buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

  /* ── Footer ──────────────────────────────────────────────── */
  .rp-footer {
    flex-shrink: 0;
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
    padding: 18px 24px;
    text-align: center;
  }
  .rp-footer-links {
    display: flex; justify-content: center; align-items: center;
    flex-wrap: wrap; gap: 6px 8px; list-style: none; margin-bottom: 6px;
  }
  .rp-footer-links a { font-size: 13px; color: var(--color-text-muted); text-decoration: none; }
  .rp-footer-links a:hover { color: var(--color-primary); text-decoration: underline; }
  .rp-footer-sep  { font-size: 12px; color: var(--color-border); user-select: none; }
  .rp-footer-copy { font-size: 12px; color: var(--color-text-muted); }

  /* ── Modal overlay + sheet ───────────────────────────────── */
  .rp-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.55);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }
  .rp-modal {
    background: var(--color-surface);
    border-radius: var(--radius);
    padding: 28px 32px 24px;
    max-width: 520px;
    width: 100%;
    max-height: 92vh;
    overflow-y: auto;
    position: relative;
  }
  .rp-modal-close {
    position: absolute;
    top: 16px; right: 16px;
    width: 30px; height: 30px;
    display: flex; align-items: center; justify-content: center;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    cursor: pointer;
    font-size: 13px; line-height: 1;
  }
  .rp-modal-close:hover { background: var(--color-bg); color: var(--color-text); }
  .rp-modal-title {
    font-size: 20px; font-weight: 600;
    color: var(--color-text);
    margin-bottom: 6px;
    padding-right: 36px;
  }
  .rp-modal-sub  {
    font-size: 14px; color: var(--color-text-muted);
    line-height: 1.5; margin-bottom: 20px;
  }

  /* Form layout */
  .rp-modal-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .rp-field      { margin-bottom: 14px; }
  .rp-fieldset   { border: none; padding: 0; }
  .rp-label {
    display: block;
    font-size: 13px; font-weight: 500;
    color: var(--color-text); margin-bottom: 5px;
  }
  .rp-label-hint { font-weight: 400; color: var(--color-text-muted); }
  .rp-required   { color: var(--color-danger); }
  .rp-input {
    width: 100%;
    height: 38px;
    padding: 0 12px;
    font-size: 14px; font-family: inherit;
    color: var(--color-text); background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    outline: none;
  }
  .rp-input:focus { border-color: var(--color-primary); }
  .rp-input::placeholder { color: var(--color-text-muted); }
  .rp-select     { cursor: pointer; }

  /* Checkbox */
  .rp-checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--color-text);
    cursor: pointer;
  }
  .rp-checkbox { width: 15px; height: 15px; cursor: pointer; flex-shrink: 0; }

  /* Confidence scale */
  .rp-confidence { display: flex; gap: 8px; margin-top: 8px; }
  .rp-conf-opt {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px; height: 38px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 14px; font-weight: 500;
    color: var(--color-text-muted);
  }
  .rp-conf-opt--on {
    border-color: var(--color-primary);
    background: rgba(37,99,235,0.08);
    color: var(--color-primary);
  }
  .rp-conf-opt:focus-within {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
  /* Visually hidden but keyboard-accessible */
  .rp-sr-only {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden;
    clip: rect(0,0,0,0);
    border: 0;
  }

  /* Error and submit */
  .rp-field-error {
    font-size: 13px; color: var(--color-danger);
    margin-bottom: 12px;
    padding: 8px 12px;
    background: rgba(220,38,38,0.06);
    border: 1px solid rgba(220,38,38,0.2);
    border-radius: var(--radius-sm);
  }
  .rp-modal-submit { width: 100%; height: 44px; margin-top: 4px; margin-bottom: 10px; }
  .rp-modal-small  { font-size: 12px; color: var(--color-text-muted); text-align: center; }

  /* ── Toast ───────────────────────────────────────────────── */
  .rp-toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #1a1a1a;
    color: #fff;
    padding: 12px 20px;
    border-radius: var(--radius-sm);
    font-size: 14px; font-weight: 500;
    z-index: 400;
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    max-width: calc(100vw - 32px);
  }
  .rp-toast-check { color: #4ade80; font-size: 15px; }

  /* ── Responsive ──────────────────────────────────────────── */
  @media (min-width: 640px) {
    .rp-topbar  { padding: 0 40px; }
    .rp-content { padding: 36px 40px 56px; }
    .rp-footer  { padding: 20px 40px; }
  }
  @media (min-width: 1024px) {
    .rp-topbar { padding: 0 60px; }
    .rp-footer { padding: 20px 60px; }
  }
  @media (max-width: 479px) {
    .rp-content      { padding: 20px 16px 40px; }
    .rp-score-card   { padding: 20px; gap: 16px; }
    .rp-cta          { padding: 20px; }
    .rp-state-box    { padding: 28px 20px; }
    .rp-header       { flex-direction: column; }
    .rp-modal        { padding: 20px 16px; }
    .rp-modal-row2   { grid-template-columns: 1fr; }
    .rp-gate-box     { padding: 20px; }
    .rp-confidence   { gap: 6px; }
    .rp-conf-opt     { width: 36px; }
  }
`;
