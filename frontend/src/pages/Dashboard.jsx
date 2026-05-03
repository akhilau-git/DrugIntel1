import { useState, useEffect } from 'react'
import axios from 'axios'
import SMILESInput from '../components/SMILESInput'
import PropertyCard from '../components/PropertyCard'
import TLCPlate from '../components/TLCPlate'
import { InteractionPanel } from '../components/InteractionPanel'
import PurityGauge from '../components/PurityGauge'
import { DosagePanel } from '../components/DosagePanel'
import { DiscoveryScore } from '../components/DiscoveryScore'
import { PubChemInfo } from '../components/PubChemInfo'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export default function Dashboard() {
    const [results, setResults] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    async function handleAnalyze(formData) {
        setLoading(true); setError(null); setResults(null)
        try {
            const res = await axios.post(`${API}/molecule/full-analysis`, formData)
            setResults(res.data)
            setTimeout(() => {
                window.scrollTo({ top: 500, behavior: 'smooth' })
            }, 100)
        } catch (e) {
            setError(e.response?.data?.error || e.message)
        }
        setLoading(false)
    }

    return (
        <div style={{ 
            maxWidth: 1200, margin: '0 auto', padding: '40px 24px',
            opacity: mounted ? 1 : 0, transition: 'opacity 0.8s ease-in-out'
        }}>
            <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative' }}>
                <div style={{ 
                    position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', 
                    width: 300, height: 300, background: 'var(--primary)', filter: 'blur(150px)', opacity: 0.15, pointerEvents: 'none', zIndex: -1 
                }} />
                
                <h1 className="outfit" style={{ 
                    fontSize: 48, fontWeight: 800, marginBottom: 16, letterSpacing: '-0.02em',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>
                    DrugIntel <span style={{ color: 'var(--primary)', WebkitTextFillColor: 'var(--primary)' }}>Platform</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 18, maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
                    Enter a SMILES sequence to engage the Deterministic Chemical Engine for complete molecular, TLC, and purity analysis.
                </p>
            </div>

            <div style={{ position: 'relative', zIndex: 10 }}>
                <SMILESInput onAnalyze={handleAnalyze} loading={loading} />
            </div>

            {error && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 12,
                    padding: '16px 24px', marginTop: 24, color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 12,
                    animation: 'fadeIn 0.4s ease-out'
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <span><strong>Analysis Error:</strong> {error}</span>
                </div>
            )}

            {loading && (
                <div style={{ textAlign: 'center', padding: '80px 20px', animation: 'fadeIn 0.5s ease-in' }}>
                    <div style={{ position: 'relative', width: 60, height: 60, margin: '0 auto', marginBottom: 24 }}>
                        <div style={{ position: 'absolute', inset: 0, border: '4px solid rgba(79, 70, 229, 0.2)', borderRadius: '50%' }} />
                        <div style={{ position: 'absolute', inset: 0, border: '4px solid var(--primary)', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-main)', letterSpacing: '0.02em' }}>Synthesizing Digital Twin...</div>
                    <div className="animate-pulse-slow" style={{ marginTop: 12, fontSize: 14, color: 'var(--text-muted)' }}>
                        Running physics simulations and ML inferences
                    </div>
                </div>
            )}

            {results && (
                <div style={{ animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    <SummaryBanner summary={results.summary} />

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginTop: 32 }}>
                        <div style={{ transitionDelay: '0.1s', animation: 'fadeInUp 0.6s ease-out both' }}><PropertyCard data={results.molecule} /></div>
                        <div style={{ transitionDelay: '0.2s', animation: 'fadeInUp 0.6s ease-out both' }}><PurityGauge data={results.purity} /></div>
                        <div style={{ transitionDelay: '0.3s', animation: 'fadeInUp 0.6s ease-out both' }}><DiscoveryScore data={results.discovery} /></div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 24, marginTop: 24 }}>
                        <div style={{ transitionDelay: '0.4s', animation: 'fadeInUp 0.6s ease-out both' }}><TLCPlate data={results.tlc} /></div>
                        <div style={{ transitionDelay: '0.5s', animation: 'fadeInUp 0.6s ease-out both' }}><DosagePanel data={results.dosage} /></div>
                    </div>

                    {results.drug_interaction && (
                        <div style={{ transitionDelay: '0.6s', animation: 'fadeInUp 0.6s ease-out both', marginTop: 24 }}>
                            <InteractionPanel data={results.drug_interaction} />
                        </div>
                    )}

                    <div style={{ transitionDelay: '0.7s', animation: 'fadeInUp 0.6s ease-out both', marginTop: 24 }}>
                        <PubChemInfo data={results.pubchem} />
                    </div>
                </div>
            )}
            
            <style jsx>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    )
}

function SummaryBanner({ summary }) {
    const isPass = summary.status === 'PASS';
    const isReview = summary.status === 'REVIEW';
    
    const bannerColor = isPass ? 'rgba(16, 185, 129, 0.15)' : isReview ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)';
    const borderColor = isPass ? 'rgba(16, 185, 129, 0.4)' : isReview ? 'rgba(245, 158, 11, 0.4)' : 'rgba(239, 68, 68, 0.4)';
    const textColor = isPass ? '#34d399' : isReview ? '#fbbf24' : '#f87171';
    
    return (
        <div className="card" style={{
            background: bannerColor,
            border: `1px solid ${borderColor}`,
            padding: '24px 32px', marginTop: 40,
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24,
            boxShadow: `0 10px 30px -10px ${bannerColor}`
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, 
                    borderRadius: '50%', background: borderColor, color: '#fff' 
                }}>
                    {isPass ? (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    ) : isReview ? (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    ) : (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                    )}
                </div>
                <div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: textColor, letterSpacing: '0.05em' }}>
                        {summary.status}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 15, color: '#e2e8f0' }}>
                        {summary.ready_for_trial ? 'Synthesis successfully cleared for physical laboratory trial.' : 'Computational parameters require further optimization.'}
                    </div>
                </div>
            </div>
            
            <div style={{ display: 'flex', gap: 16, background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                <Stat label="Discovery Match" value={`${summary.discovery_score}%`} color={textColor} />
                <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                <Stat label="Simulated Purity" value={`${summary.purity_percent}%`} color={textColor} />
                <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                <Stat label="Lipinski Rules" value={summary.lipinski ? 'Pass' : 'Fail'} color={summary.lipinski ? '#34d399' : '#f87171'} />
            </div>
        </div>
    )
}

function Stat({ label, value, color }) {
    return (
        <div style={{ textAlign: 'center', padding: '0 12px' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: color }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{label}</div>
        </div>
    )
}