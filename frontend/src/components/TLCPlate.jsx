export default function TLCPlate({ data }) {
    if (!data) return null
    const v = data.visualization || {}
    const spot = v.spot || 50
    return (
        <div className="card">
            <h2 style={{ fontSize: 18, marginBottom: 20, color: 'var(--text-main)', borderBottom: '1px solid var(--surface-border)', paddingBottom: 10 }}>
                Digital TLC Simulation
            </h2>
            <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
                <div style={{ position: 'relative' }}>
                    <svg width="120" height="240" viewBox="0 0 100 220" style={{ 
                        border: '2px solid rgba(255, 255, 255, 0.2)', 
                        background: 'linear-gradient(to bottom, #f8fafc, #e2e8f0)', 
                        borderRadius: 8,
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                    }}>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                        
                        <line x1="0" y1="15" x2="100" y2="15" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4" />
                        <text x="4" y="11" fontSize="7" fill="#1e40af" fontWeight="bold">Solvent Front</text>
                        
                        <ellipse cx="50" cy={205 - (spot / 100) * 190} rx="16" ry="10"
                            fill="rgba(139, 92, 246, 0.85)" stroke="#6d28d9" strokeWidth="1" filter="url(#glow)" />
                        <text x="70" y={205 - (spot / 100) * 190 + 3} fontSize="8" fill="#1e293b" fontWeight="600">Rf={data.rf_value}</text>
                        
                        <line x1="0" y1="205" x2="100" y2="205" stroke="#475569" strokeWidth="2" />
                        <text x="4" y="215" fontSize="7" fill="#334155" fontWeight="bold">Baseline</text>
                    </svg>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ 
                        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.2), rgba(236, 72, 153, 0.1))', 
                        border: '1px solid var(--surface-border)',
                        borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' 
                    }}>
                        <div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Retardation Factor</div>
                            <div style={{ fontSize: 32, fontWeight: 700, color: '#f8fafc', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Rf = {data.rf_value}
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                        <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>Solvent:</span> {data.solvent_info?.name || data.solvent}
                        <span style={{ marginLeft: 12, fontSize: 12, background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 12 }}>
                            Polarity: {data.solvent_info?.polarity}
                        </span>
                    </div>
                    
                    <div style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6, background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8, borderLeft: '3px solid var(--primary)' }}>
                        {data.interpretation}
                    </div>
                    
                    {data.optimal_solvent?.note !== 'Current solvent is optimal' && (
                        <div style={{
                            background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#fef3c7'
                        }}>
                            <strong style={{ color: '#fbbf24' }}>Suggestion:</strong> {data.optimal_solvent?.note} — try <strong style={{ color: '#fff' }}>{data.optimal_solvent?.suggestion}</strong>
                        </div>
                    )}
                    
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                        <span>Sample Dist: {data.distances?.distance_sample_cm} cm</span>
                        <span>Solvent Dist: {data.distances?.distance_solvent_cm} cm</span>
                    </div>
                </div>
            </div>
        </div>
    )
}