import { useEffect, useState } from 'react';
import './ProgressBar.css';

const STAGES = [
  'Checking SSL certificate…',
  'Checking security headers…',
  'Querying DNS records…',
  'Scanning open ports…',
  'Enumerating subdomains…',
  'Detecting technologies…',
  'Checking GDPR compliance…',
  'Aggregating results…',
];

export default function ProgressBar() {
  const [stageIdx, setStageIdx] = useState(0);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const stageDuration = 3200;
    const totalDuration = STAGES.length * stageDuration;

    const stageTimer = setInterval(() => {
      setStageIdx(i => Math.min(i + 1, STAGES.length - 1));
    }, stageDuration);

    const pctTimer = setInterval(() => {
      setPct(p => {
        const next = p + (100 / (totalDuration / 100));
        return Math.min(next, 95);
      });
    }, 100);

    return () => {
      clearInterval(stageTimer);
      clearInterval(pctTimer);
    };
  }, []);

  return (
    <div className="progress-wrap" role="status" aria-live="polite" aria-label="Scan in progress">
      <div className="progress-header">
        <span className="progress-spinner" aria-hidden="true" />
        <span className="progress-stage">{STAGES[stageIdx]}</span>
        <span className="progress-pct">{Math.round(pct)}%</span>
      </div>
      <div className="progress-track" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-bar" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
