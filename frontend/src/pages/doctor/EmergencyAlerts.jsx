import React from 'react';

const alerts = [
  { id: 1, time: '10:42 AM', patient: 'James Wilson', type: 'AI Diagnostic Alert', message: 'High Probability of Atrial Fibrillation detected via symptom tracker. Immediate review recommended.', severity: 'critical' },
  { id: 2, time: '09:15 AM', patient: 'Robert Ford', type: 'DDI Warning', message: 'Patient attempted to add St. John\'s Wort to regimen. Severe interaction with Atorvastatin blocked.', severity: 'warning' },
];

export default function EmergencyAlerts() {
  return (
    <div style={{ marginTop: 16 }}>
      {alerts.map(a => (
        <div key={a.id} style={{ 
          background: '#FFF', 
          border: '1px solid #E2E8F0', 
          borderLeft: `4px solid ${a.severity === 'critical' ? '#EF4444' : '#F59E0B'}`,
          borderRadius: 8, 
          padding: 16, 
          marginBottom: 12,
          display: 'flex',
          gap: 16
        }}>
          <div style={{ color: a.severity === 'critical' ? '#EF4444' : '#F59E0B', marginTop: 2 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>{a.type}</div>
              <div style={{ fontSize: 12, color: '#64748B' }}>{a.time}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Patient: {a.patient}</div>
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{a.message}</div>
            
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button style={{ background: '#2563EB', color: '#FFF', border: 'none', padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                View Full Report
              </button>
              <button style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
