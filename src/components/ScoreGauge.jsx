import './ScoreGauge.css';

const SIZE = 140;
const STROKE = 12;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

export default function ScoreGauge({ score, risk }) {
  const clipped = Math.max(0, Math.min(100, score));
  const offset = CIRCUMFERENCE - (clipped / 100) * CIRCUMFERENCE;

  const gaugeColor =
    clipped >= 80 ? '#16a34a' :
    clipped >= 60 ? '#d97706' :
    clipped >= 40 ? '#ea580c' :
                    '#dc2626';

  return (
    <div className="gauge-wrap" aria-label={`Score: ${clipped} out of 100. ${risk.label}.`}>
      <svg
        className="gauge-svg"
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-hidden="true"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={STROKE}
        />
        <circle
          className="gauge-arc"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </svg>

      <div className="gauge-center">
        <span className="gauge-score" style={{ color: gaugeColor }}>{clipped}</span>
        <span className="gauge-label">/ 100</span>
      </div>

      <div className="gauge-risk" style={{ color: risk.color }}>
        {risk.label}
      </div>
    </div>
  );
}
