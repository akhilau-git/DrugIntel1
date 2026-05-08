import React from 'react';

export default function MedicationList({ items = [], onAdd }) {
  return (
    <section className="pd-card" role="region" aria-label="My Medications">
      <div className="pd-card-header">
        <h2 className="pd-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:8,verticalAlign:'middle',opacity:0.6}}><path d="M10.5 1.5H8A6.5 6.5 0 0 0 8 14.5h8A6.5 6.5 0 0 0 16 1.5h-2.5"/><line x1="12" y1="1.5" x2="12" y2="14.5"/></svg>
          My Medications
        </h2>
        <button className="pd-link" onClick={onAdd}>+ Add</button>
      </div>
      <div className="pd-card-body" style={{padding: items.length === 0 ? '16px 20px' : '0 0 4px 0'}}>
        {items.length === 0 ? (
          <p className="pd-empty">No medications added. Add a medication to run interaction checks.</p>
        ) : (
          <table className="pd-med-table" role="table">
            <thead>
              <tr>
                <th>Medication</th>
                <th>Dose</th>
                <th>Frequency</th>
                <th>Route</th>
                <th>Start</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(m => (
                <tr key={m.id || m.name}>
                  <td className="pd-med-name">{m.name}</td>
                  <td>{m.dose || '—'}</td>
                  <td>{m.frequency || '—'}</td>
                  <td>{m.route || '—'}</td>
                  <td>{m.startDate || '—'}</td>
                  <td><button className="pd-link" style={{padding:'4px 0'}}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
