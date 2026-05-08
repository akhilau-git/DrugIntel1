import React from 'react';

const mockPatients = [
  { id: 'P001', name: 'James Wilson', age: 62, gender: 'Male', diagnosis: 'Atrial Fibrillation (AFib)', risk: 'High', meds: [{name:'Amiodarone', dose:'200mg'}, {name:'Warfarin', dose:'5mg'}] },
  { id: 'P002', name: 'Sarah Connor', age: 45, gender: 'Female', diagnosis: 'Essential Hypertension', risk: 'Low', meds: [{name:'Amlodipine', dose:'5mg'}] },
  { id: 'P003', name: 'Robert Ford', age: 58, gender: 'Male', diagnosis: 'Acute Coronary Syndrome Risk', risk: 'Moderate', meds: [{name:'Aspirin', dose:'81mg'}, {name:'Atorvastatin', dose:'40mg'}] },
];

export default function PatientList({ onSelectPatient, selectedId }) {
  return (
    <div className="doc-panel">
      <div className="doc-panel-header">
        <h2 className="doc-panel-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          Assigned Patients
        </h2>
      </div>
      <div className="doc-panel-body" style={{ padding: 0 }}>
        {mockPatients.map(p => (
          <div 
            key={p.id}
            onClick={() => onSelectPatient(p)}
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #F1F5F9',
              cursor: 'pointer',
              background: selectedId === p.id ? '#EFF6FF' : '#FFF',
              borderLeft: selectedId === p.id ? '4px solid #2563EB' : '4px solid transparent',
              transition: 'background 0.2s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>{p.name}</div>
              <span className={`doc-badge ${p.risk === 'High' ? 'doc-risk-high' : p.risk === 'Moderate' ? 'doc-risk-mod' : 'doc-risk-low'}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                {p.risk} Risk
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
              {p.age} {p.gender.charAt(0)} • {p.diagnosis}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
