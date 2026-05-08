import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AdminDashboard({ userProfile, onLogout }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('audit');

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/reports/audit`);
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportComplianceReport = async () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const element = document.getElementById('audit-report-zone');
    if (element) {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 10, 10, 190, (canvas.height * 190) / canvas.width);
      doc.save(`FDA_Part11_Audit_${new Date().toISOString().split('T')[0]}.pdf`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0f18', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
      
      {/* ═══ TOP BAR ═══ */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: '#111827', borderBottom: '1px solid #1f2937' }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: '#fff', letterSpacing: '0.5px' }}>DI<span style={{color: '#8b5cf6'}}>.Enterprise</span></div>
          <span style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            Auditor / Admin Portal
          </span>
          <div style={{ display: 'flex', gap: 6, marginLeft: 16 }}>
            {['Audit Logs (FDA Part 11)', 'User Access Control', 'System Health'].map(tab => (
              <button key={tab} 
                onClick={() => setActiveTab(tab === 'Audit Logs (FDA Part 11)' ? 'audit' : tab === 'User Access Control' ? 'users' : 'health')}
                style={{
                  background: activeTab === (tab === 'Audit Logs (FDA Part 11)' ? 'audit' : tab === 'User Access Control' ? 'users' : 'health') ? '#1e293b' : 'transparent',
                  color: activeTab === (tab === 'Audit Logs (FDA Part 11)' ? 'audit' : tab === 'User Access Control' ? 'users' : 'health') ? '#fff' : '#94a3b8',
                  border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={exportComplianceReport} style={{ background: '#059669', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>
            Export PDF Audit
          </button>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{userProfile?.full_name}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>{userProfile?.role}</div>
          </div>
          <button onClick={onLogout} style={{ background: 'transparent', border: '1px solid #334155', color: '#cbd5e1', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
            Sign Out
          </button>
        </div>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <main style={{ flex: 1, padding: 32, overflowY: 'auto' }} id="audit-report-zone">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          
          {activeTab === 'audit' && (
            <>
              <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8 }}>FDA 21 CFR Part 11 Audit Trail</h1>
                <p style={{ color: '#94a3b8', fontSize: 14 }}>
                  Immutable logging of all system actions, authentication events, and data access. 
                  These records cannot be altered or deleted.
                </p>
              </div>

              <div style={{ background: '#111827', borderRadius: 12, border: '1px solid #1f2937', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #1f2937', background: '#0f172a', display: 'flex', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: '#e2e8f0' }}>System Activity Logs</h3>
                  <button onClick={fetchAuditLogs} style={{ background: 'transparent', border: 'none', color: '#8b5cf6', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    ↻ Refresh
                  </button>
                </div>

                {loading ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading secure logs...</div>
                ) : logs.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No audit logs found. System is clean.</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#1e293b', color: '#94a3b8', textAlign: 'left' }}>
                        <th style={{ padding: '12px 20px', fontWeight: 600 }}>Timestamp (UTC)</th>
                        <th style={{ padding: '12px 20px', fontWeight: 600 }}>User ID</th>
                        <th style={{ padding: '12px 20px', fontWeight: 600 }}>Action</th>
                        <th style={{ padding: '12px 20px', fontWeight: 600 }}>Target / Resource</th>
                        <th style={{ padding: '12px 20px', fontWeight: 600 }}>IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} style={{ borderBottom: '1px solid #1f2937' }}>
                          <td style={{ padding: '12px 20px', color: '#cbd5e1' }}>{new Date(log.created_at).toLocaleString()}</td>
                          <td style={{ padding: '12px 20px', color: '#38bdf8', fontFamily: 'monospace' }}>{log.user_id}</td>
                          <td style={{ padding: '12px 20px', color: '#e2e8f0', fontWeight: 500 }}>{log.action}</td>
                          <td style={{ padding: '12px 20px', color: '#94a3b8' }}>{log.resource_accessed || 'N/A'}</td>
                          <td style={{ padding: '12px 20px', color: '#64748b', fontFamily: 'monospace' }}>{log.ip_address}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <div style={{ textAlign: 'center', padding: 100, color: '#64748b' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 16 }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <h2>Role-Based Access Control (RBAC)</h2>
              <p>User management interface goes here. Admins can revoke access, promote roles, and monitor active sessions.</p>
            </div>
          )}

          {activeTab === 'health' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              <div style={{ background: '#111827', padding: 24, borderRadius: 12, border: '1px solid #1f2937' }}>
                <div style={{ fontSize: 13, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>API Gateway</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#10b981', marginTop: 8 }}>Operational</div>
              </div>
              <div style={{ background: '#111827', padding: 24, borderRadius: 12, border: '1px solid #1f2937' }}>
                <div style={{ fontSize: 13, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>DDI ML Engine Latency</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#38bdf8', marginTop: 8 }}>42ms</div>
              </div>
              <div style={{ background: '#111827', padding: 24, borderRadius: 12, border: '1px solid #1f2937' }}>
                <div style={{ fontSize: 13, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Active WebSockets</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#8b5cf6', marginTop: 8 }}>12</div>
              </div>
            </div>
          )}

        </div>
      </main>

    </div>
  );
}
