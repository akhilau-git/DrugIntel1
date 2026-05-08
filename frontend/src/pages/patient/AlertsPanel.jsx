import React from 'react';

export default function AlertsPanel({ alerts = [], onAcknowledge }) {
  return (
    <section className="pd-card" role="region" aria-label="Active Alerts">
      <div className="pd-card-header">
        <h2 className="pd-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:8,verticalAlign:'middle',opacity:0.6}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Active Alerts
        </h2>
        {alerts.length > 0 && (
          <span style={{
            background: '#FEE2E2', color: '#DC2626',
            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 9999
          }}>{alerts.length}</span>
        )}
      </div>
      <div className="pd-card-body">
        {alerts.length === 0 ? (
          <p className="pd-empty" style={{padding:'12px 0'}}>
            <span style={{fontSize:20,display:'block',marginBottom:4}}>✓</span>
            No active alerts.
          </p>
        ) : (
          alerts.map(a => (
            <div key={a.id} className={`pd-alert-item ${a.severity === 'URGENT' ? 'urgent' : 'warning'}`}>
              <span className={`pd-severity-badge ${a.severity === 'URGENT' ? 'urgent' : 'warning'}`}>
                {a.severity}
              </span>
              <p className="pd-alert-text">{a.message}</p>
              <button className="pd-btn-ack" onClick={() => onAcknowledge?.(a.id)}>
                Acknowledge
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
