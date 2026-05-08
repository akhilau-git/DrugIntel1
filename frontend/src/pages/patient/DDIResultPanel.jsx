import React from 'react';

export default function DDIResultPanel({ result }) {
  if (!result) return null;

  const riskClass =
    result.risk === 'High' ? 'risk-high' :
    result.risk === 'Moderate' ? 'risk-moderate' : 'risk-low';

  const riskColor =
    result.risk === 'High' ? '#DC2626' :
    result.risk === 'Moderate' ? '#D97706' : '#16A34A';

  return (
    <div className={`pd-result-box ${riskClass}`} aria-live="polite" role="status">
      <div className="pd-result-header">
        <span className="pd-risk-label" style={{ color: riskColor }}>
          {result.risk === 'High' ? '⚠ ' : result.risk === 'Moderate' ? '⚡ ' : '✓ '}
          {result.risk} Risk
        </span>
        <span className="pd-confidence-label">
          Confidence: {Math.round((result.confidence || 0) * 100)}%
        </span>
      </div>
      <p className="pd-result-text">{result.action}</p>
    </div>
  );
}
