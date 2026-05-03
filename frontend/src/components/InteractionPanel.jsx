// --- InteractionPanel.jsx (paste in separate file) ---
export function InteractionPanel({ data }) {
    if (!data) return null
    const colors = { None: '#dcfce7', Minor: '#fef9c3', Moderate: '#fed7aa', Major: '#fee2e2' }
    const tc = { None: '#15803d', Minor: '#854d0e', Moderate: '#c2410c', Major: '#dc2626' }
    return (
        <div className="card" style={{ marginTop: 20 }}>
            <h2 style={{ fontSize: 16, marginBottom: 16 }}>Drug-Drug Interaction</h2>
            <div style={{
                background: colors[data.risk_level] || '#f3f4f6',
                borderRadius: 10, padding: '14px 18px', marginBottom: 16
            }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: tc[data.risk_level] }}>
                    {data.risk_level} Risk
                </div>
                <div style={{ fontSize: 13, color: '#374151', marginTop: 4 }}>
                    Confidence: {data.confidence_percent}%  |  Tanimoto similarity: {data.tanimoto_similarity}
                </div>
            </div>
            <div style={{ fontSize: 13, marginBottom: 12 }}><strong>Mechanism:</strong> {data.mechanism}</div>
            <div style={{ fontSize: 13, marginBottom: 12 }}><strong>Management:</strong> {data.management}</div>
            {data.cyp_enzyme_warnings?.length > 0 && (
                <div style={{ background: '#fef9c3', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>CYP Enzyme Warnings:</div>
                    {data.cyp_enzyme_warnings.map((w, i) => <div key={i} style={{ fontSize: 13 }}>• {w}</div>)}
                </div>
            )}
            {(data.recommendations || []).map((r, i) => (
                <div key={i} style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>• {r}</div>
            ))}
        </div>
    )
}