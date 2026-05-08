import React from 'react';

const DEFAULT_ADMET = {
  absorption: { status: 'Good', text: 'High oral bioavailability (85%). Minimal food interference.', score: 85 },
  distribution: { status: 'Warning', text: 'High plasma protein binding. May displace other CV drugs.', score: 45 },
  metabolism: { status: 'Critical', text: 'Extensive CYP3A4 substrate. High risk of accumulation.', score: 20 },
  excretion: { status: 'Good', text: 'Primary renal clearance. Safe for current eGFR.', score: 90 },
  toxicity: { status: 'Warning', text: 'Moderate risk of QT prolongation detected in GNN analysis.', score: 35 }
};

export default function AdmetSnapshot({ data }) {
  const admetData = data || DEFAULT_ADMET;

  const getScoreColor = (score) => {
    if (score >= 70) return '#10B981'; // Green
    if (score >= 40) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  return (
    <section className="pd-card" style={{ animation: 'pd-fadeSlideIn 0.5s ease-out' }}>
      <div className="pd-card-header" style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: 12 }}>
        <h2 className="pd-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#8B5CF6' }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          ADMET Pharmacokinetics
        </h2>
      </div>

      <div className="pd-card-body" style={{ paddingTop: 16 }}>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
          Real-time prediction of Absorption, Distribution, Metabolism, Excretion, and Toxicity using deep learning graph neural networks.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Object.entries(admetData).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#F9FAFB', borderRadius: 8, border: `1px solid ${getScoreColor(value.score)}40` }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${getScoreColor(value.score)}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: getScoreColor(value.score), fontWeight: 800, fontSize: 16 }}>
                {key.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'capitalize' }}>{key}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: getScoreColor(value.score) }}>{value.status}</span>
                </div>
                <div style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.4 }}>
                  {value.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
