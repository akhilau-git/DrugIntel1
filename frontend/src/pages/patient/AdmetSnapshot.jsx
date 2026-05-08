import React from 'react';

const CARDS = [
  { key: 'absorption', title: 'Absorption', defaultText: 'Good oral bioavailability predicted.', flag: 'success' },
  { key: 'metabolism', title: 'Metabolism / Toxicity', defaultText: 'Moderate hepatic burden detected.', flag: 'warn' },
  { key: 'excretion', title: 'Excretion', defaultText: 'Good renal clearance profile.', flag: 'success' }
];

export default function AdmetSnapshot({ data }) {
  return (
    <section role="region" aria-label="ADMET Snapshot">
      <div className="pd-admet-grid">
        {CARDS.map(c => {
          const d = data?.[c.key];
          const flagClass = d?.flag || c.flag;
          return (
            <div key={c.key} className={`pd-admet-card ${flagClass === 'warn' ? 'warn' : flagClass === 'danger' ? 'danger' : ''}`}>
              <div className="pd-admet-title">{c.title}</div>
              <div className="pd-admet-text">{d?.text || c.defaultText}</div>
              <div className="pd-admet-confidence">Confidence {d?.confidence ?? 0.82}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
