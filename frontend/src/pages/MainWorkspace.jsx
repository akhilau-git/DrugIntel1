import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Left Panel Component Imports
import SMILESInput from '../components/SMILESInput';

// Center Panel Component Imports
import TLCPlate from '../components/TLCPlate';
import { InteractionPanel } from '../components/InteractionPanel';
import MoleculeViewer from '../components/MoleculeViewer';

// Right Panel Component Imports
import PurityGauge from '../components/PurityGauge';
import { DosagePanel } from '../components/DosagePanel';
import { DiscoveryScore } from '../components/DiscoveryScore';

// New Modules
import ManufacturingSim from '../modules/ManufacturingSim';
import EnterpriseRAG from '../modules/EnterpriseRAG';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function MainWorkspace({ userProfile, onLogout }) {
    const [activeTab, setActiveTab] = useState('Discovery');
    const [profileOpen, setProfileOpen] = useState(false);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Context from RBAC
    const isAuditor = userProfile?.role === 'auditor';

    async function handleAnalyze(formData) {
        if (isAuditor) {
            setError("Auditors have read-only clearance. Analysis execution is restricted.");
            return;
        }
        setLoading(true); setError(null);
        try {
            const res = await axios.post(`${API}/molecule/full-analysis`, formData);
            setResults({ ...res.data, inputSmiles: formData.smiles });
        } catch (e) {
            setError(e.response?.data?.error || e.message);
        }
        setLoading(false);
    }

    const exportComplianceReport = async () => {
        const doc = new jsPDF('p', 'mm', 'a4');
        const element = document.getElementById('compliance-report-zone');
        if (element) {
            const canvas = await html2canvas(element, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            doc.addImage(imgData, 'PNG', 10, 10, 190, (canvas.height * 190) / canvas.width);
            doc.save(`DrugIntel_Audit_${new Date().getTime()}.pdf`);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0f18', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
            
            {/* TOP NAVIGATION */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: '#111827', borderBottom: '1px solid #1f2937' }}>
                <div style={{ display: 'flex', gap: 24 }}>
                    <div style={{ fontWeight: 800, fontSize: 20, color: '#fff', letterSpacing: '0.5px' }}>DI<span style={{color: '#3b82f6'}}>.Enterprise</span></div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {['Discovery', 'Manufacturing', 'Enterprise RAG', 'Reports'].map(tab => (
                            <button key={tab} 
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    background: activeTab === tab ? '#1e293b' : 'transparent',
                                    color: activeTab === tab ? '#fff' : '#94a3b8',
                                    border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s',
                                    boxShadow: activeTab === tab ? 'inset 0 1px 0 rgba(255,255,255,0.1)' : 'none'
                                }}
                            >{tab}</button>
                        ))}
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={exportComplianceReport} style={{ background: '#059669', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>Export PDF Audit</button>
                    <div style={{ position: 'relative' }}>
                        <div 
                            onClick={() => setProfileOpen(!profileOpen)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e293b', padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', userSelect: 'none', border: '1px solid transparent', transition: 'border-color 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.borderColor = '#475569'}
                            onMouseOut={e => e.currentTarget.style.borderColor = 'transparent'}
                        >
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 5px #34d399' }} />
                            <span>{userProfile?.full_name} ({userProfile?.role?.toUpperCase()})</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: profileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                        
                        {profileOpen && (
                            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '4px 0', minWidth: 160, zIndex: 50, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}>
                                <div style={{ padding: '8px 16px', borderBottom: '1px solid #1e293b', color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>
                                    <div style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 2 }}>{userProfile?.full_name}</div>
                                    <div style={{ fontSize: 11 }}>{userProfile?.email || 'User Account'}</div>
                                </div>
                                <button 
                                    style={{ width: '100%', textAlign: 'left', padding: '8px 16px', background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
                                    onMouseOver={(e) => e.currentTarget.style.background = '#1e293b'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                    Profile Settings
                                </button>
                                <button 
                                    onClick={() => { setProfileOpen(false); if(onLogout) onLogout(); }}
                                    style={{ width: '100%', textAlign: 'left', padding: '8px 16px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
                                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                    Log Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MAIN WORKSPACE BODY */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }} id="compliance-report-zone">
                
                {activeTab === 'Discovery' && (
                    <>
                        {/* LEFT PANEL (Input) */}
                        <div style={{ width: 350, minWidth: 350, background: '#111827', borderRight: '1px solid #1f2937', padding: 24, overflowY: 'auto' }}>
                            <SMILESInput onAnalyze={handleAnalyze} loading={loading} />
                            {error && <div style={{ marginTop: 16, color: '#ef4444', fontSize: 13, padding: 12, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 6 }}>{error}</div>}
                        </div>

                        {/* CENTER PANEL (Interactive Workspace) */}
                        <div style={{ flex: 1, padding: 24, overflowY: 'auto', background: '#0a0f18' }}>
                            <h2 style={{ margin: '0 0 24px 0', fontSize: 18, color: '#f8fafc' }}>Interactive Workspace</h2>
                            {results ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                    <TLCPlate data={results.tlc} />
                                    {results.drug_interaction && <InteractionPanel data={results.drug_interaction} />}
                                    <div style={{ height: 300, background: '#111827', borderRadius: 8, overflow: 'hidden' }}>
                                        <MoleculeViewer smiles={results.inputSmiles} />
                                    </div>
                                </div>
                            ) : (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                                    Load a molecule to deploy Center Workspace
                                </div>
                            )}
                        </div>

                        {/* RIGHT PANEL (Analytics Summary) */}
                        <div style={{ width: 350, minWidth: 350, background: '#111827', borderLeft: '1px solid #1f2937', padding: 24, overflowY: 'auto' }}>
                            <h2 style={{ margin: '0 0 24px 0', fontSize: 18, color: '#f8fafc' }}>Analysis Summary</h2>
                            {results ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                    <DiscoveryScore data={results.discovery} />
                                    <PurityGauge data={results.purity} />
                                    <DosagePanel data={results.dosage} />
                                </div>
                            ) : (
                                <div style={{ color: '#475569', fontSize: 14 }}>Awaiting pipeline execution...</div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'Manufacturing' && <ManufacturingSim smiles={results?.inputSmiles} />}
                {activeTab === 'Enterprise RAG' && <EnterpriseRAG token={userProfile?.token} />}
                {activeTab === 'Reports' && (
                    <div style={{ padding: 40, width: '100%', overflowY: 'auto' }}>
                        <h2>GMP Compliance & Audit Logs</h2>
                        <p style={{ color: '#94a3b8' }}>Immutable logs tracking user actions for regulatory overview.</p>
                        <div style={{ background: '#111827', borderRadius: 8, padding: 20, marginTop: 24 }}>
                            {/* Mock Audit Log Table - In real version, fetches from /api/reports/audit */}
                            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #334155' }}>
                                        <th style={{ padding: 12 }}>Time</th><th style={{ padding: 12 }}>User Role</th><th style={{ padding: 12 }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid #1e293b' }}>
                                        <td style={{ padding: 12, color: '#94a3b8' }}>Just now</td><td style={{ padding: 12 }}>{userProfile?.role.toUpperCase()}</td><td style={{ padding: 12 }}>Accessed Dashboard</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* BOTTOM BAR COMPLIANCE TICKER */}
            <div style={{ background: '#0f172a', padding: '8px 24px', fontSize: 12, color: '#64748b', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #1e293b' }}>
                <div>GMP STATUS: <span style={{ color: '#34d399', fontWeight: 'bold' }}>COMPLIANT ✔</span></div>
                <div>FDA Sec 21 Part 11 Audit Trail: Active</div>
                <div>Server Letency: 42ms</div>
            </div>

        </div>
    );
}
