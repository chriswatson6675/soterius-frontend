import { useState } from 'react';
import './ScannerCard.css';

const STATUS_LABEL = { pass: 'Pass', warn: 'Warning', fail: 'Fail', error: 'Error' };

const CARD_QUESTIONS = {
  ssl:        'Is your HTTPS certificate valid and secure?',
  headers:    'Does your site have protection against common attacks?',
  dns:        'Is your email authenticated to prevent spoofing?',
  ports:      'Are dangerous ports (like databases and SSH) exposed?',
  subdomains: 'How many subdomains does your site have?',
  tech:       'What technology is your site built with, and is it up-to-date?',
  gdpr:       'Does your site meet GDPR privacy requirements?',
};

function getCardQuestion(module) {
  return CARD_QUESTIONS[module] || 'Security check';
}

const CARD_CONTENT = {
  ssl: {
    pass: {
      explanation: "Your HTTPS certificate is valid and secure. Visitors' data is encrypted in transit.",
      advice: "No action needed. Set a calendar reminder to renew before expiry — most certificates last 90 days to 1 year.",
    },
    warn: {
      explanation: "Your HTTPS certificate is valid but has minor issues. Check the expiration date soon.",
      advice: "Renew your certificate before it expires. Your hosting provider or Let's Encrypt (free) can issue a new one in minutes. Also ensure TLS 1.2 or higher is enforced in your server config.",
    },
    fail: {
      explanation: "Your HTTPS certificate has critical problems. Browsers will show a 'Not Secure' warning to all visitors.",
      advice: "Renew or reinstall the certificate immediately. Use Let's Encrypt (free, automatic) or your hosting provider. Make sure the domain on the certificate matches your domain exactly.",
    },
    error: {
      explanation: "The SSL check couldn't connect. Your site may not have HTTPS enabled, or a firewall blocked the test.",
      advice: "Verify your server accepts connections on port 443. Check that a certificate is installed and not expired. Try visiting https://yourdomain.com directly in a browser.",
    },
  },
  headers: {
    pass: {
      explanation: "All critical security headers are configured. Your site is protected against XSS, clickjacking, and MIME-type attacks.",
      advice: "No action needed. Re-check after major deployments — framework or CDN changes can silently drop headers.",
    },
    warn: {
      explanation: "Some security headers are missing. Your site has partial protection against common browser-based attacks.",
      advice: "Add the missing headers in your web server config (Nginx/Apache), CDN (Cloudflare), or app framework. Most headers are single-line additions and take under 5 minutes. Use securityheaders.com to verify after changes.",
    },
    fail: {
      explanation: "Critical security headers are absent. Visitors are vulnerable to XSS, clickjacking, and content-type sniffing attacks.",
      advice: "Add Content-Security-Policy and Strict-Transport-Security (HSTS) headers as a priority. Then add X-Frame-Options, X-Content-Type-Options, and Referrer-Policy. Check securityheaders.com for a full guide.",
    },
    error: {
      explanation: "The headers check couldn't reach your site. This may be a temporary network issue.",
      advice: "Try scanning again. If the error persists, confirm your site responds to standard HTTP GET requests and is not behind a login wall.",
    },
  },
  dns: {
    pass: {
      explanation: "Email authentication (SPF, DKIM, DMARC) is properly set up. Your domain is protected against email spoofing.",
      advice: "No action needed. Review your DMARC reports periodically to catch any spoofing attempts early.",
    },
    warn: {
      explanation: "Email authentication is partially configured. Some of your emails may be rejected or land in spam.",
      advice: "Check which records are missing in the details below. Add the missing DNS TXT records via your domain registrar or DNS provider. DMARC with p=none is a safe starting point — it monitors without blocking.",
    },
    fail: {
      explanation: "Email authentication is not set up. Attackers can send convincing fake emails that appear to come from your domain.",
      advice: "Add an SPF record first (one DNS TXT entry). Then set up DKIM with your email provider. Finally add a DMARC record starting with p=none to monitor, then move to p=quarantine or p=reject once you're confident.",
    },
    error: {
      explanation: "DNS records couldn't be queried. This is usually a temporary DNS lookup failure.",
      advice: "Wait a few minutes and retry. If persistent, verify your domain's nameservers are responding correctly at your registrar.",
    },
  },
  ports: {
    pass: {
      explanation: "Only expected ports are reachable. Databases, dev servers, and admin interfaces are not exposed to the internet.",
      advice: "No action needed. Audit your firewall rules whenever you deploy new services to keep this clean.",
    },
    warn: {
      explanation: "Some non-standard ports are open. They may be intentional, but each open port is an potential entry point.",
      advice: "Review the open ports in the details below. Close any that don't need to be public in your firewall or cloud security group (AWS Security Groups, GCP Firewall Rules, Azure NSG).",
    },
    fail: {
      explanation: "Dangerous ports are publicly reachable. Databases or admin services are exposed directly to the internet.",
      advice: "Close the exposed ports in your firewall immediately. Database ports (3306 MySQL, 5432 PostgreSQL, 27017 MongoDB) should never be public — use a VPN or SSH tunnel to access them. Restrict SSH (22) to known IP addresses only.",
    },
    error: {
      explanation: "The port scan couldn't reach your server. A strict firewall may be blocking all probes — which is actually a good sign.",
      advice: "This is not necessarily a problem. A restrictive firewall can cause this result. Manually verify your own firewall rules to confirm only expected ports are open.",
    },
  },
  subdomains: {
    pass: {
      explanation: "Few subdomains are publicly visible in certificate transparency logs. A smaller attack surface means less risk.",
      advice: "No action needed. Periodically audit subdomains when adding new services to keep the list minimal.",
    },
    warn: {
      explanation: "Multiple subdomains were found in public certificate logs. Some may be old, forgotten, or unmonitored.",
      advice: "Review the subdomain list in the details below. Remove DNS records for any services you've decommissioned — forgotten subdomains are common targets for subdomain takeover attacks.",
    },
    fail: {
      explanation: "Many subdomains are publicly visible. Old or unmonitored subdomains are frequently exploited as entry points.",
      advice: "Audit every subdomain and remove DNS records for anything no longer in use. Check for subdomain takeover vulnerabilities — these occur when a DNS record points to a service that no longer exists (e.g., a deleted Heroku app).",
    },
    error: {
      explanation: "Subdomain lookup via certificate transparency logs (crt.sh) failed. This is usually a temporary service outage.",
      advice: "Try again in a few minutes. crt.sh is a free public service and occasionally has brief downtime.",
    },
  },
  tech: {
    pass: {
      explanation: "No significant technology disclosures or outdated libraries were detected on your homepage.",
      advice: "No immediate action needed. Keep your CMS, plugins, and npm/composer dependencies updated regularly.",
    },
    warn: {
      explanation: "Some technologies or server details were disclosed that could help attackers target your site more precisely.",
      advice: "Remove the X-Powered-By response header and hide your server version string. Keep CMS plugins updated. Consider adding a WAF (Cloudflare, AWS WAF) for an extra layer of protection.",
    },
    fail: {
      explanation: "Outdated or easily identifiable software was detected. Publicly known exploits may exist for these versions.",
      advice: "Update any outdated CMS, plugins, or libraries immediately. Search the CVE database (cve.mitre.org) for known vulnerabilities in the detected versions. Remove or disable unused plugins — they're a common attack vector.",
    },
    error: {
      explanation: "Technology detection couldn't load your homepage. Your site may be down or blocking automated requests.",
      advice: "Verify your site is accessible and not behind a login page or bot protection that blocks non-browser user agents.",
    },
  },
  gdpr: {
    pass: {
      explanation: "Your site appears to meet basic GDPR requirements — a privacy policy, cookie consent, and data rights information were detected.",
      advice: "No critical action needed. Review your privacy policy at least annually and update it to reflect any new data processing activities or third-party services.",
    },
    warn: {
      explanation: "Some GDPR requirements appear to be missing or incomplete on your homepage.",
      advice: "Add the missing elements listed below. A privacy policy link and cookie consent banner are legally required if you have EU or UK visitors. Tools like Cookiebot or OneTrust can handle consent management automatically.",
    },
    fail: {
      explanation: "Critical GDPR requirements are missing. You may face regulatory action or fines under EU/UK data protection law.",
      advice: "Add a privacy policy page and link it from your homepage immediately. Implement a cookie consent banner that loads before any tracking scripts run. Include data subject rights information: right to access, erasure, portability, and objection.",
    },
    error: {
      explanation: "GDPR compliance checks couldn't load your homepage.",
      advice: "Verify your site is publicly accessible without a login and try again.",
    },
  },
};

function getContent(module, status) {
  return CARD_CONTENT[module]?.[status] ?? {
    explanation: 'Scan complete.',
    advice: 'Review the technical details below.',
  };
}


export default function ScannerCard({ module, icon, label, status, details, issues, error }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasIssues = issues && issues.length > 0;
  const { explanation, advice } = getContent(module, status);

  function toggleExpand() {
    setIsExpanded(e => !e);
  }

  return (
    <article className={`scanner-card scanner-card-${status}`} role="listitem">

      {/* Clickable header row */}
      <div
        className="card-header card-header-clickable"
        onClick={toggleExpand}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`${label} — ${isExpanded ? 'collapse' : 'expand'} details`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(); } }}
      >
        <span className="card-icon" aria-hidden="true">{icon}</span>
        <div className="card-title-group">
          <h3 className="card-title">{label}</h3>
          <p className="card-question">{getCardQuestion(module)}</p>
          {hasIssues && (
            <span className="card-issue-count">{issues.length} issue{issues.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        <span className={`badge badge-${status}`} aria-label={`Status: ${STATUS_LABEL[status]}`}>
          {status === 'pass' && '✓ '}
          {status === 'warn' && '⚠ '}
          {status === 'fail' && '✕ '}
          {STATUS_LABEL[status]}
        </span>
        <span className={`card-chevron${isExpanded ? ' card-chevron-open' : ''}`} aria-hidden="true">▼</span>
      </div>

      {/* Always-visible summary */}
      <div className={`card-summary card-summary-${status}`}>
        <p className="card-explanation">{explanation}</p>
      </div>

      {/* Expandable: status context + issues + advice */}
      <div className={`card-body${isExpanded ? ' card-body-open' : ''}`}>
        <div className="card-body-inner">

          <div className="card-status-explanation">
            {status === 'pass'  && <p>✓ This check passed. No issues found.</p>}
            {status === 'warn'  && <p>⚠ This check has warnings. Review the items below:</p>}
            {status === 'fail'  && <p>✕ This check failed. Issues found below:</p>}
            {status === 'error' && <p>⚠ Could not complete this check.</p>}
          </div>

          {hasIssues && (
            <ul className="issues-list" aria-label="Issues found">
              {issues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          )}

          {!hasIssues && status === 'pass' && (
            <p className="no-issues">✓ No security issues detected</p>
          )}

          {status === 'error' && error && (
            <p className="error-message">Error: {error}</p>
          )}

          <div className="card-advice">
            <h4 className="card-advice-title">What to do</h4>
            <p className="card-advice-text">{advice}</p>
          </div>

        </div>
      </div>

    </article>
  );
}
