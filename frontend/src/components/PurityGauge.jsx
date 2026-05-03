// PurityGauge.jsx
export function PurityGauge({ data }) {
    if (!data) return null
    const pct = data.purity_percent || 0
    const color = pct >= 98 ? '#10b981' : pct >= 90 ? '#f59e0b' : '#ef4444'
    const shadowColor = pct >= 98 ? 'rgba(16, 185, 129, 0.4)' : pct >= 90 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(239, 68, 68, 0.4)'
    
    return (
        <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: shadowColor, filter: 'blur(80px)', borderRadius: '50%', opacity: 0.5, pointerEvents: 'none' }} />
            
            <h2 style={{ fontSize: 18, marginBottom: 20, color: 'var(--text-main)', borderBottom: '1px solid var(--surface-border)', paddingBottom: 10 }}>Purity Analysis</h2>
            
            <div style={{ textAlign: 'center', marginBottom: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="140" height="140" viewBox="0 0 100 100" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
                        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                        <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="6" 
                            strokeDasharray={`${pct * 2.82} 282`} strokeLinecap="round" 
                            style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                    </svg>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-main)', textShadow: `0 0 20px ${shadowColor}` }}>{pct}%</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TLC Purity</span>
                    </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 16, color: '#f8fafc', background: color, padding: '4px 12px', borderRadius: 12, boxShadow: `0 4px 10px ${shadowColor}` }}>
                    {data.grade}
                </div>
            </div>
            
            <div style={{ marginBottom: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 12 }}>
                {(data.tests || []).map((t, i) => (
                    <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 0', borderBottom: i === data.tests.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)', fontSize: 13
                    }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: t.pass ? 'var(--text-main)' : 'var(--danger)' }}>
                            <span style={{ 
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, 
                                borderRadius: '50%', background: t.pass ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' 
                            }}>
                                {t.pass ? '✓' : '✗'}
                            </span>
                            {t.test}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{t.value}</span>
                    </div>
                ))}
            </div>
            
            <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6, padding: 12, background: 'rgba(56, 189, 248, 0.1)', borderLeft: '3px solid #38bdf8', borderRadius: 4 }}>
                {data.recommendation}
            </div>
        </div>
    )
}
export default PurityGauge