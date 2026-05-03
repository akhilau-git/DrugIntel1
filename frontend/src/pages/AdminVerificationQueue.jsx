import { useEffect, useState } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export default function AdminVerificationQueue({ userProfile, onLogout }) {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [notesById, setNotesById] = useState({})

    useEffect(() => {
        loadQueue()
    }, [])

    const authHeaders = {
        Authorization: `Bearer ${userProfile?.token}`
    }

    const loadQueue = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await axios.get(`${API}/api/v1/auth/verification/queue`, { headers: authHeaders })
            setItems(res.data)
        } catch (err) {
            setError(err.response?.data?.detail || err.message)
        }
        setLoading(false)
    }

    const updateStatus = async (verificationId, status) => {
        try {
            await axios.patch(`${API}/api/v1/auth/verification/queue/${verificationId}`, {
                status,
                reviewer_notes: notesById[verificationId] || ''
            }, { headers: authHeaders })
            await loadQueue()
        } catch (err) {
            setError(err.response?.data?.detail || err.message)
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #08111f 0%, #0f172a 100%)', color: '#e2e8f0', padding: 24, fontFamily: "'Inter', sans-serif" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 32 }}>Verification Queue</h1>
                    <p style={{ margin: '6px 0 0', color: '#94a3b8' }}>Review professional signups and update their verification status.</p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 14, color: '#cbd5e1' }}>{userProfile?.full_name}</span>
                    <button onClick={onLogout} style={buttonSecondary}>Log out</button>
                </div>
            </div>

            {error && <div style={alertStyle}>{error}</div>}
            {loading ? (
                <div style={cardStyle}>Loading verification requests...</div>
            ) : items.length === 0 ? (
                <div style={cardStyle}>No verification requests found.</div>
            ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                    {items.map(item => (
                        <div key={item.id} style={cardStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 700 }}>{item.email}</div>
                                    <div style={{ color: '#94a3b8', marginTop: 4 }}>Role: {item.role}</div>
                                </div>
                                <div style={{ alignSelf: 'flex-start', padding: '6px 12px', borderRadius: 999, background: 'rgba(59,130,246,0.16)', color: '#93c5fd', fontSize: 12, textTransform: 'uppercase' }}>
                                    {item.status}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 16, fontSize: 14 }}>
                                <Info label="License Number" value={item.license_number || 'N/A'} />
                                <Info label="Institution Email" value={item.institution_email || 'N/A'} />
                                <Info label="Institution" value={item.institution_name || 'N/A'} />
                                <Info label="Employee ID" value={item.employee_id || 'N/A'} />
                                <Info label="ORCID" value={item.orcid || 'N/A'} />
                            </div>

                            <div style={{ marginTop: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, marginBottom: 6, color: '#cbd5e1' }}>Reviewer Notes</label>
                                <input
                                    value={notesById[item.id] ?? item.reviewer_notes ?? ''}
                                    onChange={e => setNotesById({ ...notesById, [item.id]: e.target.value })}
                                    placeholder="Add reviewer notes"
                                    style={inputStyle}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                                <button onClick={() => updateStatus(item.id, 'approved')} style={buttonPrimary}>Approve</button>
                                <button onClick={() => updateStatus(item.id, 'rejected')} style={buttonDanger}>Reject</button>
                                <button onClick={() => updateStatus(item.id, 'needs_info')} style={buttonSecondary}>Need More Info</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function Info({ label, value }) {
    return (
        <div>
            <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>{label}</div>
            <div style={{ color: '#e2e8f0' }}>{value}</div>
        </div>
    )
}

const cardStyle = {
    background: 'rgba(15, 23, 42, 0.85)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 12px 30px rgba(0,0,0,0.2)'
}

const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: 8,
    border: '1px solid rgba(148, 163, 184, 0.2)',
    background: '#0b1220',
    color: '#e2e8f0',
    padding: '10px 12px',
    outline: 'none'
}

const buttonBase = {
    border: 'none',
    borderRadius: 8,
    padding: '10px 14px',
    fontWeight: 700,
    cursor: 'pointer'
}

const buttonPrimary = {
    ...buttonBase,
    background: 'linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)',
    color: '#fff'
}

const buttonDanger = {
    ...buttonBase,
    background: 'linear-gradient(180deg, #fb7185 0%, #e11d48 100%)',
    color: '#fff'
}

const buttonSecondary = {
    ...buttonBase,
    background: 'rgba(255,255,255,0.08)',
    color: '#e2e8f0',
    border: '1px solid rgba(255,255,255,0.14)'
}

const alertStyle = {
    background: 'rgba(239, 68, 68, 0.16)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fecaca',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
}
