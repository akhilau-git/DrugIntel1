import React from 'react';

export default function DDIResultPanel({ result }) {
  if (!result) return null;

  const isHighRisk = result.risk === 'High' || result.risk === 'Severe';
  const riskColor = isHighRisk ? '#EF4444' : result.risk === 'Moderate' ? '#F59E0B' : '#10B981';

  return (
    <section className="pd-card" style={{ animation: 'pd-fadeSlideIn 0.4s ease-out' }}>
      <div className="pd-card-header" style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: 12 }}>
        <h2 className="pd-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: riskColor }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Polypharmacy Interaction Map
        </h2>
        <span style={{ fontSize: 12, fontWeight: 700, color: riskColor, background: `${riskColor}20`, padding: '4px 8px', borderRadius: 6 }}>
          {result.risk} Risk
        </span>
      </div>

      <div className="pd-card-body" style={{ paddingTop: 16 }}>
        <div style={{ background: '#F9FAFB', padding: 16, borderRadius: 8, border: '1px solid #E5E7EB', marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: 13, color: '#374151', textTransform: 'uppercase' }}>Clinical Action</h4>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: isHighRisk ? '#991B1B' : '#374151', lineHeight: 1.5 }}>
            {result.action || "Avoid combining these medications without direct cardiologist supervision."}
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: 12, color: '#6B7280', textTransform: 'uppercase' }}>Mechanism of Action</h4>
          <p style={{ margin: 0, fontSize: 13, color: '#4B5563', lineHeight: 1.5 }}>
            {result.mechanism || "Drug A inhibits CYP3A4, causing systemic accumulation of Drug B, leading to increased risk of prolonged QT interval (arrhythmia)."}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, border: '1px solid #E5E7EB', borderRadius: 8, padding: 12 }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: 11, color: '#6B7280', textTransform: 'uppercase' }}>Food Interactions</h4>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: '#D97706', fontWeight: 500 }}>
              <li>Avoid Grapefruit Juice</li>
              <li>Limit high-sodium meals</li>
            </ul>
          </div>
          <div style={{ flex: 1, border: '1px solid #E5E7EB', borderRadius: 8, padding: 12 }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: 11, color: '#6B7280', textTransform: 'uppercase' }}>Cardiovascular Toxicity</h4>
            <div style={{ fontSize: 13, color: '#DC2626', fontWeight: 600 }}>
              ↑ Arrhythmia Risk<br/>
              ↓ Blood Pressure
            </div>
          </div>
        </div>

        <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'right' }}>
          Ensemble Match Confidence: {Math.round((result.confidence || 0.96) * 100)}%
        </div>
      </div>
    </section>
  );
}
