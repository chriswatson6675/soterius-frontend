import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function cleanDomain(raw) {
  return raw.trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .toLowerCase();
}

const DOMAIN_RE =
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

const BENEFITS = [
  '7-point security audit',
  'Compliance checks (SRA/FCA/ICAEW)',
  'No credit card required',
];

function ShieldIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      {/* Outer shield */}
      <path
        d="M32 4 L8 14 L8 36 C8 50 20 58 32 62 C44 58 56 50 56 36 L56 14 Z"
        fill="#185FA5"
      />
      {/* Inner lighter shield */}
      <path
        d="M32 12 L15 20 L15 36 C15 47 22.5 53.5 32 57 C41.5 53.5 49 47 49 36 L49 20 Z"
        fill="#378ADD"
      />
      {/* Checkmark */}
      <polyline
        points="23,34 29,41 41,27"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

const css = `
  .lp *, .lp *::before, .lp *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .lp {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, Arial, sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    color: #1a1a1a;
    font-size: 16px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Topbar ──────────────────────────────────────────────── */
  .lp-topbar {
    flex-shrink: 0;
    height: 54px;
    background: #ffffff;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    align-items: center;
    padding: 0 24px;
  }

  .lp-brand {
    font-size: 17px;
    font-weight: 700;
    color: #185FA5;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }

  /* ── Hero ────────────────────────────────────────────────── */
  .lp-hero {
    min-height: 50vh;
    display: flex;
    align-items: center;
    background: linear-gradient(165deg, #ddeaf8 0%, #eaf3fb 35%, #f4f8fd 65%, #ffffff 100%);
    padding: 48px 24px;
    text-align: center;
  }

  .lp-hero-inner {
    max-width: 600px;
    margin: 0 auto;
    width: 100%;
  }

  .lp-shield-wrap {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
  }

  .lp-hero h1 {
    font-size: 32px;
    font-weight: 500;
    line-height: 1.2;
    color: #1a1a1a;
    margin-bottom: 14px;
    letter-spacing: -0.01em;
  }

  .lp-hero-sub {
    font-size: 18px;
    font-weight: 400;
    line-height: 1.4;
    color: #444444;
    margin-bottom: 16px;
  }

  .lp-trust-line {
    font-size: 14px;
    font-weight: 400;
    color: #666666;
    line-height: 1.5;
  }

  /* ── CTA section ─────────────────────────────────────────── */
  .lp-cta {
    flex: 1;
    padding: 40px 24px 48px;
    background: #ffffff;
    border-top: 3px solid #185FA5;
  }

  .lp-cta-inner {
    max-width: 540px;
    margin: 0 auto;
  }

  .lp-cta h2 {
    font-size: 20px;
    font-weight: 400;
    line-height: 1.4;
    color: #1a1a1a;
    margin-bottom: 24px;
  }

  .lp-input-row {
    display: flex;
    margin-bottom: 0;
  }

  .lp-input {
    flex: 1;
    min-width: 0;
    height: 44px;
    padding: 0 14px;
    font-size: 16px;
    font-family: inherit;
    color: #1a1a1a;
    background: #ffffff;
    border: 1.5px solid #e0e0e0;
    border-right: none;
    border-radius: 4px 0 0 4px;
    outline: none;
  }

  .lp-input:focus {
    border-color: #185FA5;
  }

  .lp-input::placeholder {
    color: #aaaaaa;
    font-size: 14px;
  }

  .lp-submit {
    height: 44px;
    padding: 0 20px;
    font-size: 15px;
    font-family: inherit;
    font-weight: 600;
    color: #ffffff;
    background: #185FA5;
    border: 1.5px solid #185FA5;
    border-radius: 0 4px 4px 0;
    cursor: pointer;
    white-space: nowrap;
    letter-spacing: 0.01em;
  }

  .lp-submit:hover {
    background: #124d88;
    border-color: #124d88;
  }

  .lp-submit:active {
    background: #0e3c6d;
    border-color: #0e3c6d;
  }

  /* Error — always-present container prevents layout shift */
  .lp-error-slot {
    min-height: 22px;
    margin-top: 6px;
    margin-bottom: 6px;
  }

  .lp-error {
    font-size: 14px;
    color: #E24B4A;
    line-height: 1.4;
  }

  /* Benefits */
  .lp-benefits {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 20px;
    list-style: none;
  }

  .lp-benefit {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #666666;
    line-height: 1.4;
  }

  .lp-check {
    flex-shrink: 0;
    font-size: 16px;
    font-weight: 700;
    color: #0F6E56;
    line-height: 1;
  }

  /* ── Footer ──────────────────────────────────────────────── */
  .lp-footer {
    flex-shrink: 0;
    background: #f8f9fa;
    border-top: 1px solid #e0e0e0;
    padding: 18px 24px;
    text-align: center;
  }

  .lp-footer-links {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px 8px;
    list-style: none;
    margin-bottom: 8px;
  }

  .lp-footer-links a {
    font-size: 13px;
    color: #666666;
    text-decoration: none;
  }

  .lp-footer-links a:hover {
    color: #185FA5;
    text-decoration: underline;
  }

  .lp-footer-sep {
    font-size: 12px;
    color: #cccccc;
    user-select: none;
  }

  .lp-footer-copy {
    font-size: 13px;
    color: #999999;
  }

  /* ── Responsive ──────────────────────────────────────────── */
  @media (min-width: 640px) {
    .lp-topbar   { padding: 0 40px; }
    .lp-hero     { padding: 56px 40px; }
    .lp-cta      { padding: 52px 40px 60px; }
    .lp-footer   { padding: 20px 40px; }
    .lp-hero h1  { font-size: 38px; }
  }

  @media (min-width: 1024px) {
    .lp-topbar   { padding: 0 60px; }
    .lp-hero     { padding: 60px 60px; }
    .lp-cta      { padding: 60px 60px 72px; }
    .lp-footer   { padding: 22px 60px; }
    .lp-hero h1  { font-size: 42px; }
  }

  /* Mobile: stack input + button vertically */
  @media (max-width: 479px) {
    .lp-input-row        { flex-direction: column; }
    .lp-input            { border-right: 1.5px solid #e0e0e0; border-bottom: none;
                           border-radius: 4px 4px 0 0; height: 44px; }
    .lp-input:focus      { border-color: #185FA5; }
    .lp-submit           { border-radius: 0 0 4px 4px; width: 100%; height: 44px; }
  }
`;

export default function Landing() {
  const [domain, setDomain] = useState('');
  const [error,  setError]  = useState('');
  const navigate = useNavigate();

  function handleChange(e) {
    setDomain(e.target.value);
    if (error) setError('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    const cleaned = cleanDomain(domain);
    if (!cleaned || !DOMAIN_RE.test(cleaned)) {
      setError('Please enter a valid domain, e.g. yourfirm.co.uk');
      return;
    }
    navigate(`/results?domain=${encodeURIComponent(cleaned)}`);
  }

  return (
    <>
      <style>{css}</style>
      <div className="lp">

        {/* ── Topbar ── */}
        <div className="lp-topbar" role="banner">
          <span className="lp-brand">Soterius</span>
        </div>

        {/* ── Hero ── */}
        <section className="lp-hero" aria-labelledby="lp-heading">
          <div className="lp-hero-inner">
            <div className="lp-shield-wrap">
              <ShieldIcon />
            </div>
            <h1 id="lp-heading">Is Your Domain Secure?</h1>
            <p className="lp-hero-sub">
              Scan now. Identify risks. Fix compliance gaps.
            </p>
            <p className="lp-trust-line">
              Trusted by UK solicitors, accountants, financial advisers
            </p>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="lp-cta" aria-label="Domain scanner">
          <div className="lp-cta-inner">
            <h2>Get Your Free Security Report in 60 Seconds</h2>
            <form onSubmit={handleSubmit} noValidate aria-label="Scan your domain">
              <div className="lp-input-row">
                <input
                  className="lp-input"
                  type="text"
                  value={domain}
                  onChange={handleChange}
                  placeholder="e.g., example.co.uk"
                  aria-label="Domain name"
                  aria-describedby="lp-error"
                  autoComplete="off"
                  spellCheck="false"
                  inputMode="url"
                />
                <button className="lp-submit" type="submit">
                  Scan My Domain
                </button>
              </div>
              <div className="lp-error-slot" aria-live="polite">
                {error && (
                  <p id="lp-error" className="lp-error" role="alert">
                    {error}
                  </p>
                )}
              </div>
            </form>
            <ul className="lp-benefits" aria-label="What's included">
              {BENEFITS.map(text => (
                <li key={text} className="lp-benefit">
                  <span className="lp-check" aria-hidden="true">✓</span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="lp-footer">
          <ul className="lp-footer-links">
            <li><a href="/privacy">Privacy Policy</a></li>
            <li aria-hidden="true" className="lp-footer-sep">|</li>
            <li><a href="/terms">Terms of Service</a></li>
            <li aria-hidden="true" className="lp-footer-sep">|</li>
            <li><a href="/contact">Contact</a></li>
          </ul>
          <p className="lp-footer-copy">© 2026 Soterius</p>
        </footer>

      </div>
    </>
  );
}
