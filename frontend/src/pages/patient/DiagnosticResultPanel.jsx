import React from 'react';

export default function DiagnosticResultPanel({ result }) {
  if (!result) return null;

  return (
    <section className="pd-card" style={{ animation: 'pd-fadeSlideIn 0.3s ease-out' }}>
      <div className="pd-card-header" style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: 12 }}>
        <h2 className="pd-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ 
            background: 'rgba(59, 130, 246, 0.1)', 
            color: '#3B82F6', 
            padding: '4px 8px', 
            borderRadius: 6, 
            fontSize: 12, 
            fontWeight: 700 
          }}>
            AI RESULT
          </span>
        </h2>
      </div>

      <div className="pd-card-body" style={{ paddingTop: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
            Predicted Condition
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>
            {result.prediction}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, background: '#F9FAFB', padding: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Confidence Score</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: result.confidence > 0.8 ? '#10B981' : '#F59E0B' }}>
              {(result.confidence * 100).toFixed(1)}%
            </div>
          </div>
          <div style={{ flex: 1, background: '#F9FAFB', padding: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Model Used</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', lineHeight: 1.2 }}>
              {result.model_used}
            </div>
          </div>
        </div>

        {result.warnings && result.warnings.length > 0 && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #EF4444', padding: 12, borderRadius: '0 8px 8px 0', marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#B91C1C', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              CRITICAL WARNING
            </div>
            {result.warnings.map((w, idx) => (
              <div key={idx} style={{ fontSize: 13, color: '#991B1B', lineHeight: 1.4 }}>{w}</div>
            ))}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>
            Recommendations
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#374151', fontSize: 13, lineHeight: 1.6 }}>
            {result.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>

        <button style={{
          width: '100%',
          padding: '10px',
          background: '#FFF',
          border: '1px solid #D1D5DB',
          borderRadius: 6,
          color: '#374151',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'all 0.2s'
        }} onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'} onMouseLeave={e => e.currentTarget.style.background = '#FFF'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          View Detailed Explanation
        </button>
      </div>
    </section>
  );
}
