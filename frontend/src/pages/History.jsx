// History page (frontend/src/pages/History.jsx):
import { useEffect, useState } from 'react'
import axios from 'axios'
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
export default function History() {
    const [records, setRecords] = useState([])
    useEffect(() => {
        axios.get(`${API}/molecule/history`).then(r => setRecords(r.data)).catch(() => { })
    }, [])
    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
            <h1 style={{ fontSize: 24, marginBottom: 20 }}>Analysis History</h1>
            {records.length === 0 && <p style={{ color: '#6b7280' }}>No analyses yet. Run an analysis first.</p>}
            {records.map((r, i) => (
                <div key={i} className="card" style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: 600 }}>{r.drug_name || 'Unknown drug'}</div>
                            <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#6b7280', marginTop: 2 }}>{r.smiles?.slice(0, 50)}</div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: 13 }}>
                            <div>Score: {r.drug_score}</div>
                            <div style={{ color: '#6b7280', fontSize: 11 }}>{new Date(r.created_at).toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}