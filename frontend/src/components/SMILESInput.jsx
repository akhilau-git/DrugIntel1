import { useState } from 'react'
const EXAMPLES = {
    'Aspirin': { smiles: 'CC(=O)Oc1ccccc1C(=O)O', note: 'Pain reliever, anti-inflammatory' },
    'Caffeine': { smiles: 'Cn1cnc2c1c(=O)n(c(=O)n2C)C', note: 'CNS stimulant' },
    'Ibuprofen': { smiles: 'CC(C)Cc1ccc(cc1)C(C)C(=O)O', note: 'NSAID pain reliever' },
    'Paracetamol': { smiles: 'CC(=O)Nc1ccc(O)cc1', note: 'Analgesic, antipyretic' },
    'Morphine': { smiles: 'OC1=CC2=C(C=C1OC)C3CC(=O)CCC3N(CC2)C', note: 'Opioid analgesic' },
    'Atorvastatin': { smiles: 'CC(C)c1c(C(=O)Nc2ccccc2F)c(-c2ccccc2)c(-c2ccc(F)cc2)n1CCC(O)CC(O)CC(=O)O', note: 'Cholesterol medication' },
}
const SOLVENTS = [
    ['hexane', 'Hexane — non-polar'], ['toluene', 'Toluene'], ['dichloromethane', 'DCM'],
    ['ethyl_acetate', 'Ethyl acetate (95%)'], ['acetone', 'Acetone'],
    ['methanol', 'Methanol'], ['chloroform', 'Chloroform'],
]

export default function SMILESInput({ onAnalyze, loading }) {
    const [smiles1, setS1] = useState('')
    const [smiles2, setS2] = useState('')
    const [name1, setN1] = useState('')
    const [name2, setN2] = useState('')
    const [solvent, setSolvent] = useState('ethyl_acetate')
    const [spots, setSpots] = useState(1)
    const [showAdv, setShowAdv] = useState(false)

    function submit() {
        if (!smiles1.trim()) return alert('Please enter a SMILES string for Drug 1')
        onAnalyze({
            smiles: smiles1.trim(),
            drug2_smiles: smiles2.trim() || null,
            solvent, drug_name: name1,
            num_spots: spots,
            spot_intensities: spots === 1 ? [1.0] : Array(spots).fill(0).map((_, i) => i === 0 ? 1.0 : 0.3)
        })
    }

    return (
        <div className="card" style={{ 
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.4)', 
            border: '1px solid rgba(255,255,255,0.05)',
            position: 'relative', overflow: 'hidden' 
        }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, background: 'linear-gradient(90deg, #4f46e5, #ec4899, #3b82f6)' }} />
            
            <h2 className="outfit" style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3v2M15 3v2M5 8h14M5 16h14M7 8v12h10V8"></path></svg>
                Digital Twin Setup
            </h2>
            
            <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                    Primary Compound (SMILES) *
                </label>
                <input value={smiles1} onChange={e => setS1(e.target.value)}
                    placeholder="Enter valid SMILES sequence or select a template below..."
                    style={{ width: '100%', fontFamily: 'monospace', fontSize: 16, padding: '16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }} />
                
                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', paddingRight: 8 }}>Quick Load:</span>
                    {Object.entries(EXAMPLES).map(([name, { smiles, note }]) => (
                        <button key={name} onClick={() => { setS1(smiles); setN1(name) }}
                            title={note}
                            style={{
                                fontSize: 12, padding: '4px 12px', background: 'rgba(56, 189, 248, 0.1)',
                                border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: 20, color: '#38bdf8',
                                transition: 'all 0.2s', fontWeight: 500
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)' }}
                            onMouseOut={e => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)' }}
                        >
                            {name}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24, marginBottom: 24 }}>
                <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                        Target Identity (Optional)
                    </label>
                    <input value={name1} onChange={e => setN1(e.target.value)}
                        placeholder="e.g., Experimental Compound A" style={{ width: '100%' }} />
                </div>
                <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                        TLC Mobile Phase Setup
                    </label>
                    <select value={solvent} onChange={e => setSolvent(e.target.value)} style={{ width: '100%' }}>
                        {SOLVENTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 24 }}>
                <button onClick={() => setShowAdv(!showAdv)}
                    style={{
                        width: '100%', background: 'transparent', color: 'var(--text-main)', border: 'none', borderRadius: 0,
                        padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderBottom: showAdv ? '1px solid rgba(255,255,255,0.05)' : 'none'
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={showAdv ? "var(--primary)" : "var(--text-muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3z"></path><path d="M12 8v8"></path><path d="M8 12h8"></path></svg>
                        <span style={{ fontWeight: 600, color: showAdv ? 'var(--text-main)' : 'var(--text-muted)' }}>Advanced Synthesis Control (DDI & Purity Config)</span>
                    </div>
                </button>
                
                <div style={{ 
                    maxHeight: showAdv ? 500 : 0, opacity: showAdv ? 1 : 0, overflow: 'hidden', 
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', padding: showAdv ? '16px' : '0 16px' 
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div style={{ background: 'rgba(56, 189, 248, 0.05)', padding: 16, borderRadius: 8, border: '1px solid rgba(56, 189, 248, 0.1)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, marginBottom: 12, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#38bdf8' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                                DDI Target (Drug 2 SMILES)
                            </label>
                            <input value={smiles2} onChange={e => setS2(e.target.value)}
                                placeholder="Compound to test against for severe interactions..."
                                style={{ width: '100%', fontFamily: 'monospace', marginBottom: 12, border: '1px solid rgba(56, 189, 248, 0.3)' }} />
                            <input value={name2} onChange={e => setN2(e.target.value)}
                                placeholder="Target 2 Name (Optional)"
                                style={{ width: '100%', border: '1px solid rgba(56, 189, 248, 0.3)' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                                Artificial TLC Impurities (1 = pure, 2+ = contaminated)
                            </label>
                            <input type="number" min="1" max="6" value={spots}
                                onChange={e => setSpots(+e.target.value)} style={{ width: 120, background: 'rgba(0,0,0,0.4)', textAlign: 'center', fontSize: 18, fontWeight: 'bold' }} />
                        </div>
                    </div>
                </div>
            </div>

            <button onClick={submit} disabled={loading}
                style={{
                    background: loading ? 'var(--surface)' : 'var(--primary)',
                    color: loading ? 'var(--text-muted)' : '#fff', 
                    padding: '16px', fontSize: 18, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                    border: loading ? '1px solid var(--surface-border)' : 'none', 
                    borderRadius: 12, width: '100%', position: 'relative', overflow: 'hidden'
                }}>
                {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        <span style={{ width: 20, height: 20, border: '3px solid var(--text-muted)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        Running Analysis...
                    </span>
                ) : (
                    <span style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        Initiate Discovery Sequence
                    </span>
                )}
            </button>
        </div>
    )
}