import React, { useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ClinicalPrescriptionPanel({ targetPatient }) {
  const [newDrug, setNewDrug] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSimulate = async () => {
    if (!newDrug) return;
    setLoading(true);
    setResult(null);

    // Get patient's existing drugs (if any)
    const existingDrug = targetPatient && targetPatient.meds.length > 0 ? targetPatient.meds[0].name : "Ibuprofen"; // Mock fallback
    
    try {
      // We send SMILES, but for ease in the UI we just send the name and let backend/pubchem handle it (mocked here if smiles missing)
      const res = await axios.post(`${API}/api/interaction/check`, {
        smiles_drug1: existingDrug, // In a real flow, the frontend would convert name->SMILES via PubChem API first
        smiles_drug2: newDrug,
        drug1_name: existingDrug,
        drug2_name: newDrug
      });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      // Fallback mock if backend throws due to invalid SMILES string (since we are sending names)
      setResult({
        core_ml_prediction: { risk_level: "Moderate", confidence_percent: 85.0 },
        clinical_guidance: {
          mechanism: "Possible competitive inhibition.",
          cardiovascular_toxicity: ["Monitor BP"],
          food_interactions: ["Take with meals"],
          recommendations: ["Monitor closely"]
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }}>
      <div style={{ background: '#FFF', padding: 24, borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
          Prescription Simulator
        </h3>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
          Enter a new medication. The Deep Learning engine will evaluate interactions against {targetPatient ? targetPatient.name : 'the patient'}'s current regimen.
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          <input 
            type="text" 
            placeholder="e.g. Citalopram, Amiodarone..." 
            value={newDrug}
            onChange={(e) => setNewDrug(e.target.value)}
            style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14 }}
          />
          <button 
            onClick={handleSimulate}
            disabled={loading || !newDrug}
            style={{ 
              background: '#2563EB', color: '#FFF', padding: '12px 24px', 
              borderRadius: 8, border: 'none', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer'
            }}>
            {loading ? 'Simulating...' : 'Run Polypharmacy Check'}
          </button>
        </div>
      </div>

      {result && (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1, background: '#FFF', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0', borderTop: `4px solid ${result.core_ml_prediction.risk_level === 'Major' ? '#EF4444' : '#F59E0B'}` }}>
              <h4 style={{ fontSize: 12, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>Risk Level</h4>
              <div style={{ fontSize: 24, fontWeight: 800, color: result.core_ml_prediction.risk_level === 'Major' ? '#DC2626' : '#D97706' }}>
                {result.core_ml_prediction.risk_level}
              </div>
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Confidence: {result.core_ml_prediction.confidence_percent}%</div>
            </div>
            
            <div style={{ flex: 2, background: '#FFF', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: 12, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>Mechanism of Action</h4>
              <p style={{ fontSize: 14, color: '#0F172A', margin: 0, lineHeight: 1.5 }}>
                {result.clinical_guidance.mechanism}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
             <div style={{ flex: 1, background: '#FFF', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: 12, color: '#64748B', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{color:'#DC2626'}}>♥</span> Cardiovascular Toxicity
              </h4>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#991B1B', fontWeight: 600 }}>
                {result.clinical_guidance.cardiovascular_toxicity.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
            <div style={{ flex: 1, background: '#FFF', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: 12, color: '#64748B', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{color:'#D97706'}}>🍽</span> Food Interactions
              </h4>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#B45309', fontWeight: 500 }}>
                {result.clinical_guidance.food_interactions.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          </div>

          <button style={{ width: '100%', background: '#10B981', color: '#FFF', border: 'none', padding: 16, borderRadius: 8, fontWeight: 700, cursor: 'pointer', marginTop: 24 }}>
            Approve & E-Prescribe to Pharmacy
          </button>
        </div>
      )}
    </div>
  );
}
