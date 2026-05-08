import React from 'react';

const MOCK_HISTORY = [
  { id: 'h1', date: '2026-05-03', summary: 'Metformin + Cimetidine — High Risk', risk: 'High' },
  { id: 'h2', date: '2026-05-01', summary: 'Aspirin + Ibuprofen — Moderate Risk', risk: 'Moderate' },
  { id: 'h3', date: '2026-04-28', summary: 'Metformin only — Low Risk', risk: 'Low' }
];

export default function HistoryList({ items }) {
  const history = items && items.length > 0 ? items : MOCK_HISTORY;

  const riskDot = (risk) => {
    const color = risk === 'High' ? '#DC2626' : risk === 'Moderate' ? '#F59E0B' : '#16A34A';
    return <span style={{
      width: 8, height: 8, borderRadius: '50%', background: color,
      display: 'inline-block', marginRight: 8, flexShrink: 0
    }} />;
  };

  return (
    <section className="pd-card" role="region" aria-label="History & Reports">
      <div className="pd-card-header">
        <h2 className="pd-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:8,verticalAlign:'middle',opacity:0.6}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          History & Reports
        </h2>
      </div>
      <div className="pd-card-body" style={{padding:'8px 20px 16px'}}>
        {history.map(h => (
          <div key={h.id} className="pd-history-item">
            <div style={{display:'flex',alignItems:'center'}}>
              {riskDot(h.risk)}
              <div>
                <div className="pd-history-summary">{h.summary}</div>
                <div className="pd-history-date">{h.date}</div>
              </div>
            </div>
            <button className="pd-link" style={{fontSize:12,padding:'4px 0'}}>View</button>
          </div>
        ))}
      </div>
    </section>
  );
}
