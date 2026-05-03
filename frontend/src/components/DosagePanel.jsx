// --- DosagePanel.jsx ---
export function DosagePanel({ data }) {
    if (!data) return null
    const pk = data.pharmacokinetics || {}
    return (
        <div className="card">
            <h2 style={{ fontSize: 16, marginBottom: 16 }}>Dosage Estimation</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[['Single dose', `${data.estimated_dose_mg} mg`], ['Daily dose', `${data.daily_dose_mg} mg`],
                ['Route', data.route], ['Half-life', `${pk.half_life_hours} h`],
                ['Bioavailability', `${Math.round((pk.bioavailability_F || 0) * 100)}%`], ['Onset', `${data.route_details?.onset_min} min`]
                ].map(([l, v]) => (
                    <div key={l} style={{ background: '#f9fafb', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{l}</div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{v}</div>
                    </div>
                ))}
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', borderTop: '1px solid #f3f4f6', paddingTop: 10 }}>
                {data.disclaimer}
            </div>
        </div>
    )
}