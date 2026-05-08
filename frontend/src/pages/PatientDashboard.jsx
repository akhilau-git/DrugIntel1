// src/pages/PatientDashboard.jsx — Main orchestrator
import React, { useState, useEffect } from 'react';
import './patient/PatientDashboard.css';

// Child components
import CardioSymptomTracker from './patient/CardioSymptomTracker';
import DiagnosticResultPanel from './patient/DiagnosticResultPanel';
import DDIResultPanel from './patient/DDIResultPanel';
import MedicationList from './patient/MedicationList';
import AdmetSnapshot from './patient/AdmetSnapshot';
import DosingCard from './patient/DosingCard';
import InteractionExplanation from './patient/InteractionExplanation';
import AlertsPanel from './patient/AlertsPanel';
import HistoryList from './patient/HistoryList';
import ShareModal from './patient/ShareModal';

// API service
import { runDDICheck, predictCardio } from '../services/api';

export default function PatientDashboard({ userProfile, onLogout }) {
  // ── State ──────────────────────────────────────────────────
  const [medications, setMedications] = useState([
    { id: 1, name: 'Metformin', dose: '500 mg', frequency: 'Twice daily', route: 'Oral', startDate: '2025-10-01' }
  ]);
  const [ddiResult, setDdiResult] = useState(null);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState([
    { id: 1, severity: 'URGENT', message: 'Avoid combining Metformin and Cimetidine; contact clinician immediately.' }
  ]);
  const [shareOpen, setShareOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // ── Handlers ───────────────────────────────────────────────
  async function handlePredict(data) {
    setLoading(true);
    setDiagnosisResult(null);
    try {
      const result = await predictCardio(data);
      setDiagnosisResult(result);
    } catch (err) {
      console.error(err);
      setDiagnosisResult({
        prediction: 'API connection failed',
        confidence: 0,
        model_used: 'None',
        recommendations: ['Ensure backend is running on port 8000.'],
        warnings: []
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRunCheck(meds) {
    setLoading(true);
    try {
      const result = await runDDICheck({
        patientId: userProfile?.id?.toString(),
        medications: meds
      });
      setDdiResult(result);
    } catch (err) {
      console.error('DDI Check failed:', err);
      setDdiResult({
        risk: 'High',
        action: 'API connection failed. Ensure backend is running on port 8000.',
        confidence: 0,
        mechanism: 'Network error',
        model_run_id: 'error'
      });
    } finally {
      setLoading(false);
    }
  }

  function handleAcknowledge(id) {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }

  // Close profile menu on outside click
  useEffect(() => {
    function handleClick() { setProfileMenuOpen(false); }
    if (profileMenuOpen) document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [profileMenuOpen]);

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="pd-root">

      {/* ═══ TOP BAR ═══ */}
      <header className="pd-topbar" role="banner">
        <div className="pd-topbar-left">
          <span className="pd-logo">DrugIntel</span>
          <span className="pd-role-badge">Patient</span>
        </div>

        <div className="pd-topbar-center">My Health Dashboard</div>

        <div className="pd-topbar-right">
          {!userProfile?.profile_complete && (
            <button className="pd-btn-complete-profile" title="Complete your profile for personalized dosing and history-aware checks.">
              Complete Profile
            </button>
          )}

          <button className="pd-notification-btn" aria-label="Notifications">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {alerts.length > 0 && <span className="pd-notification-dot" />}
          </button>

          <div className="pd-avatar-menu" onClick={(e) => { e.stopPropagation(); setProfileMenuOpen(!profileMenuOpen); }}>
            <div className="pd-avatar">{userProfile?.full_name?.charAt(0) || 'U'}</div>
            <span className="pd-avatar-name">{userProfile?.full_name || 'User'}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.5, transform: profileMenuOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.2s'}}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>

          {/* Profile dropdown */}
          {profileMenuOpen && (
            <div style={{
              position:'absolute', top:56, right:32,
              background:'#fff', border:'1px solid #E5E7EB', borderRadius:10,
              boxShadow:'0 10px 25px -5px rgba(0,0,0,0.15)', minWidth:200, zIndex:50,
              animation:'pd-fadeSlideIn 0.2s ease-out'
            }}>
              <div style={{padding:'12px 16px',borderBottom:'1px solid #F3F4F6'}}>
                <div style={{fontWeight:600,fontSize:14,color:'#111827'}}>{userProfile?.full_name || 'User'}</div>
                <div style={{fontSize:12,color:'#6B7280',marginTop:2}}>{userProfile?.email || 'patient@email.com'}</div>
              </div>
              <button style={{
                width:'100%',textAlign:'left',padding:'10px 16px',background:'transparent',
                color:'#374151',fontSize:13,display:'flex',alignItems:'center',gap:8,borderRadius:0
              }}
                onMouseEnter={e=>e.currentTarget.style.background='#F9FAFB'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Profile Settings
              </button>
              <button onClick={onLogout} style={{
                width:'100%',textAlign:'left',padding:'10px 16px',background:'transparent',
                color:'#DC2626',fontSize:13,display:'flex',alignItems:'center',gap:8,
                borderRadius:'0 0 10px 10px'
              }}
                onMouseEnter={e=>e.currentTarget.style.background='#FEF2F2'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ═══ MAIN 3-COLUMN GRID ═══ */}
      <div className="pd-canvas">
        <div className="pd-grid">

          {/* ── LEFT COLUMN (320px) ── */}
          <div className="pd-stagger" style={{display:'flex',flexDirection:'column',gap:24}}>
            <CardioSymptomTracker
              onPredict={handlePredict}
              loading={loading}
            />
            {diagnosisResult && <DiagnosticResultPanel result={diagnosisResult} />}
            <MedicationList items={medications} onAdd={() => {}} onRunCheck={handleRunCheck} />
          </div>

          {/* ── CENTER COLUMN (flex) ── */}
          <div className="pd-stagger" style={{display:'flex',flexDirection:'column',gap:24}}>
            <AdmetSnapshot data={null} />
            <DosingCard dosing={null} />
            <InteractionExplanation
              modelRunId={ddiResult?.model_run_id}
              ddiResult={ddiResult}
            />
          </div>

          {/* ── RIGHT COLUMN (320px) ── */}
          <div className="pd-stagger" style={{display:'flex',flexDirection:'column',gap:24}}>
            <AlertsPanel alerts={alerts} onAcknowledge={handleAcknowledge} />

            {/* Care Coordination */}
            <section className="pd-card">
              <div className="pd-card-header">
                <h2 className="pd-card-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:8,verticalAlign:'middle',opacity:0.6}}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                  Care Coordination
                </h2>
              </div>
              <div className="pd-card-body">
                <p style={{fontSize:13,color:'#6B7280',lineHeight:1.5,marginBottom:16}}>
                  Securely share your medication history and interaction reports with your healthcare provider.
                </p>
                <button className="pd-btn-share" onClick={() => setShareOpen(true)}>
                  Share with Clinician
                </button>
              </div>
            </section>

            <HistoryList items={[]} />
          </div>
        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <footer className="pd-footer">
        <div>Model v1.2 — last run 2026‑05‑03 12:34 UTC — Confidence: 0.87</div>
        <div className="pd-footer-links">
          <a href="#">Contact Support</a>
          <a href="#">Privacy Policy</a>
          <span className="pd-gmp-badge">● GMP Compliant</span>
        </div>
      </footer>

      {/* ═══ MOBILE FAB ═══ */}
      <button className="pd-fab" role="button" aria-label="Add medication or run DDI">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>

      {/* ═══ SHARE MODAL ═══ */}
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
