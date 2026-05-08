import React, { useState } from 'react';
import './doctor/DoctorDashboard.css';

import PatientList from './doctor/PatientList';
import ClinicalPrescriptionPanel from './doctor/ClinicalPrescriptionPanel';
import EmergencyAlerts from './doctor/EmergencyAlerts';
import SecureChat from '../components/SecureChat';

export default function DoctorDashboard({ userProfile, onLogout }) {
  const [activeTab, setActiveTab] = useState('patients');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="doc-root">
      {/* ═══ TOP BAR ═══ */}
      <header className="doc-topbar">
        <div className="doc-logo-group">
          <span className="doc-logo">DrugIntel</span>
          <span className="doc-badge">Clinician Portal</span>
        </div>

        <nav className="doc-nav-center">
          <div className={`doc-nav-item ${activeTab === 'patients' ? 'active' : ''}`} onClick={() => setActiveTab('patients')}>
            My Patients
          </div>
          <div className={`doc-nav-item ${activeTab === 'ddi_engine' ? 'active' : ''}`} onClick={() => setActiveTab('ddi_engine')}>
            Clinical DDI Engine
          </div>
          <div className={`doc-nav-item ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>
            Emergency Alerts <span style={{ background: '#EF4444', color: '#FFF', padding: '2px 6px', borderRadius: 10, fontSize: 10, marginLeft: 4 }}>2</span>
          </div>
        </nav>

        <div className="doc-topbar-right">
          <div style={{ textAlign: 'right', marginRight: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Dr. {userProfile?.full_name || 'Clinician'}</div>
            <div style={{ fontSize: 11, color: '#64748B' }}>{userProfile?.organization || 'Cardiology Dept'}</div>
          </div>
          <button onClick={onLogout} style={{
            background: 'transparent', border: '1px solid #E2E8F0', padding: '6px 12px',
            borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#64748B'
          }}>
            Sign Out
          </button>
        </div>
      </header>

      {/* ═══ MAIN WORKSPACE ═══ */}
      <main className="doc-canvas">
        <div className="doc-grid">
          
          {/* LEFT COLUMN: Patient List */}
          <PatientList 
            onSelectPatient={(p) => { setSelectedPatient(p); setActiveTab('patients'); }} 
            selectedId={selectedPatient?.id} 
          />

          {/* CENTER COLUMN: Main Content */}
          <div className="doc-panel" style={{ gridColumn: 'span 1' }}>
            <div className="doc-panel-header">
              <h2 className="doc-panel-title">
                {activeTab === 'patients' && selectedPatient ? `Patient File: ${selectedPatient.name}` : 
                 activeTab === 'ddi_engine' ? 'Advanced Polypharmacy Interaction Engine' : 
                 activeTab === 'alerts' ? 'Active Clinical Alerts' : 'Overview'}
              </h2>
            </div>
            <div className="doc-panel-body" style={{ background: '#F8FAFC', padding: 0 }}>
              
              {activeTab === 'patients' && selectedPatient && (
                <div style={{ padding: 24 }}>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                    <div style={{ flex: 1, background: '#FFF', padding: 16, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Age / Gender</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>{selectedPatient.age} y/o {selectedPatient.gender}</div>
                    </div>
                    <div style={{ flex: 1, background: '#FFF', padding: 16, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Latest AI Diagnosis</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#DC2626', marginTop: 4 }}>{selectedPatient.diagnosis}</div>
                    </div>
                  </div>
                  
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 12, borderBottom: '1px solid #E2E8F0', paddingBottom: 8 }}>
                    Current Medication Regimen
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                    {selectedPatient.meds.map((m, idx) => (
                      <div key={idx} style={{ background: '#FFF', padding: '12px 16px', borderRadius: 6, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>{m.name}</span>
                        <span style={{ color: '#64748B', fontSize: 13 }}>{m.dose}</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => setActiveTab('ddi_engine')}
                    style={{ width: '100%', background: '#2563EB', color: '#FFF', border: 'none', padding: 12, borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
                    Prescribe New Medication (Run DDI Check)
                  </button>
                </div>
              )}

              {activeTab === 'patients' && !selectedPatient && (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                  Select a patient from the list to view their file.
                </div>
              )}

              {activeTab === 'ddi_engine' && (
                <ClinicalPrescriptionPanel targetPatient={selectedPatient} />
              )}

              {activeTab === 'alerts' && (
                <div style={{ padding: 24 }}>
                  <p style={{ color: '#64748B', fontSize: 14 }}>Real-time alerts triggered by patient symptom entries and AI diagnostics.</p>
                  <EmergencyAlerts />
                </div>
              )}

            </div>
          </div>

          {/* RIGHT COLUMN: Actionable Tools */}
          <div className="doc-panel">
            <div className="doc-panel-header">
              <h2 className="doc-panel-title">Clinical Tools</h2>
            </div>
            <div className="doc-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button 
                onClick={() => setChatOpen(true)}
                style={{ padding: 16, background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 8, textAlign: 'left', cursor: 'pointer' }}>
                <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>Send Secure Message</div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Contact patient directly via HIPAA-ready chat.</div>
              </button>
              <button style={{ padding: 16, background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 8, textAlign: 'left', cursor: 'pointer' }}>
                <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>Generate Lab Requisition</div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Order bloodwork / ECG based on AI recommendation.</div>
              </button>
              <button style={{ padding: 16, background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 8, textAlign: 'left', cursor: 'pointer' }}>
                <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>Consult Cardiology Specialist</div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Share interaction report with specialist network.</div>
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* ═══ SECURE CHAT ═══ */}
      {chatOpen && (
        <SecureChat 
          userProfile={userProfile} 
          recipientName={selectedPatient ? selectedPatient.name : "Unassigned Patient"} 
          onClose={() => setChatOpen(false)} 
        />
      )}
    </div>
  );
}
