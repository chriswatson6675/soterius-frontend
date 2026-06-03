import { useState } from 'react';
import './ScanForm.css';

const DOMAIN_RE = /^(?!-)(?:[a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,}$/;

function normalizeDomain(input) {
  return input.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
}

export default function ScanForm({ onSubmit, disabled }) {
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);

  const normalized = normalizeDomain(value);
  const isValid = DOMAIN_RE.test(normalized);
  const showError = touched && value.length > 0 && !isValid;

  function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    onSubmit(normalized);
  }

  return (
    <form className="scan-form" onSubmit={handleSubmit} noValidate aria-label="Domain scanner">
      <div className="scan-input-group">
        <input
          className={`scan-input${showError ? ' scan-input-error' : ''}`}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="example.com"
          aria-label="Domain to scan"
          aria-invalid={showError}
          aria-describedby={showError ? 'scan-input-hint' : undefined}
          disabled={disabled}
          autoComplete="off"
          spellCheck="false"
        />
        <button
          type="submit"
          className="btn btn-primary scan-btn"
          disabled={disabled || !value.trim()}
          aria-busy={disabled}
        >
          {disabled ? (
            <><span className="scan-spinner" aria-hidden="true" /> Scanning…</>
          ) : (
            'Scan Now'
          )}
        </button>
      </div>

      {showError && (
        <p id="scan-input-hint" className="scan-error" role="alert">
          Enter a valid domain (e.g. example.com — no http://)
        </p>
      )}
    </form>
  );
}
