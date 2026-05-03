// --- DiscoveryScore.jsx ---
export function DiscoveryScore({ data }) {
    if (!data) return null
    const ready = data.pipeline_readiness || {}
    const colorMap = { READY: '#dcfce7', OPTIMIZE: '#fed7aa', CAUTION: '#fee2e2', REJECT: '#fee2e2' }
    const tcMap = { READY: '#15803d', OPTIMIZE: '#c2410c', CAUTION: '#dc2626', REJECT: '#dc2626' }
    return (
        <div className="card">
            <h2 style={{ fontSize: 16, marginBottom: 16 }}>Discovery Pipeline Score</h2>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: '#2563eb' }}>{data.overall_score}</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>out of 100</div>
            </div>
            <div style={{
                background: colorMap[ready.status] || '#f3f4f6',
                borderRadius: 8, padding: '10px 14px', marginBottom: 14
            }}>
                <div style={{ fontWeight: 700, color: tcMap[ready.status] || '#374151' }}>{ready.status}</div>
                <div style={{ fontSize: 13, color: '#374151' }}>{ready.stage}</div>
            </div>
            {data.flags?.pains_alerts?.length > 0 && (
                <div style={{ background: '#fee2e2', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 13, color: '#dc2626' }}>
                    PAINS alert: {data.flags.pains_alerts[0]}
                </div>
            )}
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Next steps:</div>
            {(data.next_steps || []).map((s, i) => (
                <div key={i} style={{ fontSize: 13, color: '#374151', marginBottom: 5 }}>{i + 1}. {s}</div>
            ))}
        </div>
    )
}