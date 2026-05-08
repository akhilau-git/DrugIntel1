import React, { useState } from 'react';

export default function QuickDDICard({ medications = [], onRunCheck, loading }) {
  const [input, setInput] = useState('');
  const [stagedMeds, setStagedMeds] = useState([]);

  function addMed() {
    const name = input.trim();
    if (!name || stagedMeds.includes(name)) return;
    setStagedMeds(prev => [...prev, name]);
    setInput('');
  }

  function removeMed(name) {
    setStagedMeds(prev => prev.filter(m => m !== name));
  }

  function handleRun() {
    const allMeds = [
      ...medications.map(m => ({ name: m.name, dose: m.dose, frequency: m.frequency })),
      ...stagedMeds.map(name => ({ name }))
    ];
    onRunCheck(allMeds);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); addMed(); }
  }

  const canRun = medications.length + stagedMeds.length >= 1;

  return (
    <section className="pd-card" role="region" aria-label="Quick DDI Check">
      <div className="pd-card-header">
        <h2 className="pd-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:8,verticalAlign:'middle',opacity:0.6}}><path d="M9 12h6"/><path d="M12 9v6"/><circle cx="12" cy="12" r="10"/></svg>
          Quick DDI Check
        </h2>
      </div>
      <div className="pd-card-body">
        <div className="pd-ddi-input-row">
          <input
            aria-label="Medication input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter medication name (e.g., metformin)"
          />
          <button className="pd-ddi-add-btn" onClick={addMed} title="Add medication" aria-label="Add medication">+</button>
        </div>

        {/* Staged medication chips */}
        {stagedMeds.length > 0 && (
          <div style={{marginBottom: 8}}>
            {stagedMeds.map(name => (
              <span key={name} className="pd-med-chip">
                {name}
                <button className="pd-med-chip-remove" onClick={() => removeMed(name)} aria-label={`Remove ${name}`}>×</button>
              </span>
            ))}
          </div>
        )}

        <div className="pd-actions-row">
          <button className="pd-btn-primary" onClick={handleRun} disabled={loading || !canRun}>
            {loading ? 'Checking…' : 'Run Check'}
          </button>
          <button className="pd-btn-secondary">Save Check</button>
        </div>

        <p className="pd-microcopy">This is decision support only. Consult your clinician for medical advice.</p>
      </div>
    </section>
  );
}
