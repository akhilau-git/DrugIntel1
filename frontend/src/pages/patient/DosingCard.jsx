import React from 'react';

export default function DosingCard({ dosing }) {
  return (
    <section className="pd-card" role="region" aria-label="Personalized Dosing">
      <div className="pd-card-header">
        <h2 className="pd-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:8,verticalAlign:'middle',opacity:0.6}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Suggested dose range
        </h2>
        <span style={{
          fontSize: 12, fontWeight: 600,
          background: '#DBEAFE', color: '#1D4ED8',
          padding: '4px 10px', borderRadius: 12
        }}>
          Confidence {dosing?.confidence ?? 0.87}
        </span>
      </div>
      <div className="pd-card-body">
        <div className="pd-dose-value">{dosing?.rangeText || '25–50 mg once daily'}</div>
        <div className="pd-dose-rationale">
          {dosing?.rationale || 'Rationale: weight 62 kg; eGFR 78 mL/min/1.73m². Take with food to enhance absorption.'}
        </div>
        <div className="pd-dose-note">
          This is guidance only. Follow your clinician's prescription.
        </div>
      </div>
    </section>
  );
}
