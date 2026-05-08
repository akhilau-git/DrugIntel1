import React, { useState } from 'react';

export default function CardioSymptomTracker({ onPredict, loading }) {
  const [symptoms, setSymptoms] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [medicalHistory, setMedicalHistory] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!symptoms.trim()) return;
    onPredict({
      symptoms: symptoms.split(',').map(s => s.trim()),
      age: parseInt(age, 10) || null,
      gender,
      medicalHistory: medicalHistory
    });
  };

  return (
    <section className="pd-card">
      <div className="pd-card-header">
        <h2 className="pd-card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:8, verticalAlign:'middle', color:'#ef4444'}}>
            <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
          </svg>
          Cardiovascular AI Diagnostics
        </h2>
      </div>
      <div className="pd-card-body">
        <p style={{fontSize:13, color:'#6B7280', lineHeight:1.5, marginBottom:16}}>
          Enter your symptoms and history. Our ensemble ML engine will dynamically select the highest accuracy model to assess your condition.
        </p>
        
        <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'12px'}}>
          <div style={{display:'flex', gap:'12px'}}>
            <div style={{flex:1}}>
              <label style={{display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:4}}>Age</label>
              <input type="number" placeholder="e.g. 55" value={age} onChange={e => setAge(e.target.value)} style={{width:'100%', padding:'8px 12px', border:'1px solid #D1D5DB', borderRadius:6, fontSize:14}} required />
            </div>
            <div style={{flex:1}}>
              <label style={{display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:4}}>Gender</label>
              <select value={gender} onChange={e => setGender(e.target.value)} style={{width:'100%', padding:'8px 12px', border:'1px solid #D1D5DB', borderRadius:6, fontSize:14}}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:4}}>Symptoms (comma separated)</label>
            <textarea 
              placeholder="e.g. Chest pain, shortness of breath, irregular heartbeat" 
              value={symptoms} 
              onChange={e => setSymptoms(e.target.value)}
              style={{width:'100%', padding:'10px 12px', border:'1px solid #D1D5DB', borderRadius:6, fontSize:14, minHeight:'60px', resize:'vertical'}}
              required
            />
          </div>

          <div>
            <label style={{display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:4}}>Known Medical History & Ongoing Meds</label>
            <textarea 
              placeholder="e.g. Hypertension, previously prescribed Metformin" 
              value={medicalHistory} 
              onChange={e => setMedicalHistory(e.target.value)}
              style={{width:'100%', padding:'10px 12px', border:'1px solid #D1D5DB', borderRadius:6, fontSize:14, minHeight:'50px', resize:'vertical'}}
            />
          </div>

          <div style={{display:'flex', gap:'12px', alignItems:'center', marginTop:4}}>
            <button type="submit" disabled={loading} style={{
              flex: 1,
              padding: '10px 16px',
              background: 'linear-gradient(180deg, #3B82F6 0%, #2563EB 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 4px rgba(37,99,235,0.2)',
              opacity: loading ? 0.7 : 1
            }}>
              {loading ? 'Analyzing with Ensemble ML...' : 'Analyze Symptoms'}
            </button>
            <button type="button" style={{
              padding: '10px 16px',
              background: '#F3F4F6',
              color: '#374151',
              border: '1px solid #D1D5DB',
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer'
            }} title="Upload Prescription OCR">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
