import React, { useState, useRef } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function PrescriptionScanner({ onMedicationsExtracted }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setError(null);
    }
  };

  const handleScan = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API}/api/ocr/scan`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (res.data.status === 'success') {
        onMedicationsExtracted(res.data.extracted_medications);
      } else {
        throw new Error("Failed to process document");
      }
    } catch (err) {
      console.error(err);
      setError("Document Analysis Failed. Please ensure the image is clear and legible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 12, padding: 24 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
        Document AI Lens (OCR)
      </h3>
      <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 20 }}>
        Upload a photo of a prescription or pill bottle. The Gemini Vision Engine will automatically extract medication details to populate your regimen.
      </p>

      {!preview ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed #334155', borderRadius: 8, padding: 40, textAlign: 'center',
            cursor: 'pointer', background: 'rgba(255,255,255,0.02)', transition: 'border 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = '#334155'}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
          <div style={{ color: '#E2E8F0', fontWeight: 600, fontSize: 14 }}>Click to upload an image</div>
          <div style={{ color: '#64748B', fontSize: 12, marginTop: 4 }}>JPEG, PNG, WEBP supported</div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <img src={preview} alt="Prescription preview" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8, border: '1px solid #334155' }} />
            <button 
              onClick={() => { setFile(null); setPreview(null); }}
              style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#FFF', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <button 
              onClick={handleScan}
              disabled={loading}
              style={{
                background: loading ? '#1E293B' : '#3B82F6',
                color: loading ? '#94A3B8' : '#FFF',
                border: 'none', padding: 16, borderRadius: 8, fontSize: 15, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
              }}>
              {loading ? (
                <>
                  <span style={{ width: 16, height: 16, border: '2px solid #94A3B8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                  Extracting Text...
                </>
              ) : 'Run AI Extraction'}
            </button>
            {error && <div style={{ color: '#EF4444', fontSize: 13, marginTop: 12, padding: 12, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 6 }}>{error}</div>}
          </div>
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        style={{ display: 'none' }} 
      />

    </div>
  );
}
