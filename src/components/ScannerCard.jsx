import { useState } from 'react';
import './ScannerCard.css';

const SCANNER_ICONS = {
  'SSL/TLS Encryption':       '🔒',
  'Security Headers':         '🛡️',
  'Email Security':           '📧',
  'Vulnerable Components':    '🔧',
  'Password Security':        '🔑',
  'Infrastructure Exposure':  '🏗️',
  'GDPR / Cookie Compliance': '⚖️',
};

function cardStatus(score) {
  if (score >= 80) return 'pass';
  if (score >= 50) return 'warn';
  return 'fail';
}

function checkBadge(status) {
  if (status === 'PASS')    return { icon: '✓', css: 'pass', label: 'Pass'    };
  if (status === 'WARNING') return { icon: '⚠', css: 'warn', label: 'Warning' };
  return                           { icon: '✕', css: 'fail', label: 'Fail'    };
}

export default function ScannerCard({ name, score, checks }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const icon       = SCANNER_ICONS[name] ?? '🔍';
  const status     = cardStatus(score);
  const issueCount = checks.filter(c => c.status !== 'PASS').length;
  const summaryText = issueCount === 0
    ? `All ${checks.length} checks passed`
    : `${issueCount} of ${checks.length} checks need attention`;

  function toggle() { setIsExpanded(e => !e); }

  return (
    <article className={`scanner-card scanner-card-${status}`} role="listitem">

      <div
        className="card-header card-header-clickable"
        onClick={toggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`${name} — ${isExpanded ? 'collapse' : 'expand'} details`}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }}
      >
        <span className="card-icon" aria-hidden="true">{icon}</span>
        <div className="card-title-group">
          <h3 className="card-title">{name}</h3>
          {issueCount > 0 && (
            <span className="card-issue-count">{issueCount} issue{issueCount !== 1 ? 's' : ''}</span>
          )}
        </div>
        <span className={`sc-score-badge sc-score-${status}`}>{score}%</span>
        <span className={`card-chevron${isExpanded ? ' card-chevron-open' : ''}`} aria-hidden="true">▼</span>
      </div>

      <div className={`card-summary card-summary-${status}`}>
        <p className="card-explanation">{summaryText}</p>
      </div>

      <div className={`card-body${isExpanded ? ' card-body-open' : ''}`}>
        <div className="card-body-inner">
          <ul className="sc-checks-list" aria-label="Individual checks">
            {checks.map((check, i) => {
              const badge = checkBadge(check.status);
              return (
                <li key={i} className={`sc-check sc-check-${badge.css}`}>
                  <span className={`sc-check-badge sc-badge-${badge.css}`} aria-label={badge.label}>
                    {badge.icon}
                  </span>
                  <div className="sc-check-body">
                    <p className="sc-check-name">{check.name}</p>
                    {check.details   && <p className="sc-check-details">{check.details}</p>}
                    {check.timeToFix && <p className="sc-check-fix">Est. fix time: {check.timeToFix}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

    </article>
  );
}
