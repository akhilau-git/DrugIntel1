import React, { useState } from 'react';
import { shareReport } from '../../services/api';

export default function ShareModal({ open, onClose }) {
  const [email, setEmail] = useState('');
  const [scope, setScope] = useState('Full Profile');
  const [timeLimit, setTimeLimit] = useState('7 Days');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  async function handleShare() {
    if (!consent || !email) return;
    setSubmitting(true);
    try {
      await shareReport({
        clinician_email: email,
        scope,
        time_limit: timeLimit,
        consent
      });
      setSuccess(true);
      setTimeout(() => { onClose(); setSuccess(false); setEmail(''); setConsent(false); }, 1500);
    } catch (e) {
      alert('Failed to share: ' + (e.response?.data?.detail || e.message));
    }
    setSubmitting(false);
  }

  return (
    <div className="pd-modal-overlay" role="dialog" aria-modal="true" aria-label="Share with Clinician"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pd-modal">
        <div className="pd-modal-header">
          <h2 className="pd-modal-title">Share with Clinician</h2>
          <button className="pd-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="pd-modal-body">
          {success ? (
            <div style={{textAlign:'center',padding:'32px 0'}}>
              <div style={{fontSize:40,marginBottom:12}}>✓</div>
              <div style={{fontSize:16,fontWeight:600,color:'#16A34A'}}>Report shared successfully</div>
              <div style={{fontSize:13,color:'#6B7280',marginTop:4}}>Your clinician will receive access shortly.</div>
            </div>
          ) : (
            <>
              <div>
                <label className="pd-field-label">Clinician Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="doctor@hospital.com" />
              </div>
              <div>
                <label className="pd-field-label">Scope</label>
                <select value={scope} onChange={e => setScope(e.target.value)}>
                  <option>Full Profile</option>
                  <option>Selected Checks</option>
                  <option>Single Report</option>
                </select>
              </div>
              <div>
                <label className="pd-field-label">Time Limit</label>
                <select value={timeLimit} onChange={e => setTimeLimit(e.target.value)}>
                  <option>24 Hours</option>
                  <option>7 Days</option>
                  <option>30 Days</option>
                </select>
              </div>
              <div className="pd-consent-row">
                <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
                <span className="pd-consent-text">
                  I consent to share my selected data with the clinician named above for care coordination.
                </span>
              </div>
            </>
          )}
        </div>
        {!success && (
          <div className="pd-modal-footer">
            <button className="pd-btn-secondary" onClick={onClose}>Cancel</button>
            <button className="pd-btn-primary" onClick={handleShare} disabled={!consent || !email || submitting}>
              {submitting ? 'Sharing…' : 'Share Now'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
