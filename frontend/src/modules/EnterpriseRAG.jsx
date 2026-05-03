import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function EnterpriseRAG({ token }) {
    const [messages, setMessages] = useState([
        { id: 1, role: 'system', text: 'Secure Connection Established. Enterprise RAG initialized. I can query Internal Trials, FDA Guidelines, and SOPs. How can I assist you?', sources: [] }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const endRef = useRef(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { id: Date.now(), role: 'user', text: input, sources: [] };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await axios.post(`${API}/rag/chat`, 
                { message: input }, 
                { headers: { Authorization: `Bearer ${token}` } } // Pass JWT token to enforce RBAC logic
            );
            
            const aiMsg = { 
                id: Date.now() + 1, 
                role: 'system', 
                text: res.data.reply, 
                sources: res.data.sources 
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err) {
            const errorMsg = { id: Date.now() + 1, role: 'system', text: `ERROR: ${err.response?.data?.detail || err.message}`, sources: [] };
            setMessages(prev => [...prev, errorMsg]);
        }
        setLoading(false);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
            {/* Chat Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '40px 20%' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f8fafc', marginBottom: 40 }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    Enterprise RAG Intelligence
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {messages.map(m => (
                        <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                            <div style={{
                                maxWidth: '80%', padding: '16px 20px', borderRadius: 12,
                                background: m.role === 'user' ? '#2563eb' : '#1e293b',
                                color: '#fff', fontSize: 15, lineHeight: 1.6,
                                border: m.role === 'user' ? 'none' : '1px solid #334155',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                            }}>
                                {m.text}
                            </div>
                            
                            {m.sources && m.sources.length > 0 && (
                                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {m.sources.map((src, i) => (
                                        <span key={i} style={{ fontSize: 11, background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                                            Citation: {src}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    {loading && (
                        <div style={{ alignSelf: 'flex-start', background: '#1e293b', padding: '16px 20px', borderRadius: 12, color: '#94a3b8' }}>
                            <span className="dot-pulse">Querying Vector Database & Evaluating Compliance...</span>
                        </div>
                    )}
                    <div ref={endRef} />
                </div>
            </div>

            {/* Input Form */}
            <div style={{ padding: '20px 20%', background: '#111827', borderTop: '1px solid #1f2937' }}>
                <form onSubmit={handleSend} style={{ position: 'relative' }}>
                    <input 
                        type="text" value={input} onChange={e => setInput(e.target.value)}
                        placeholder={token ? "Ask a question about internal trials or compliance..." : "Authentication Error. No Token."}
                        disabled={loading || !token}
                        style={{
                            width: '100%', padding: '16px 20px', paddingRight: 60, borderRadius: 30,
                            border: '1px solid #334155', background: '#0a0f18', color: '#fff', outline: 'none', fontSize: 15
                        }}
                    />
                    <button type="submit" disabled={loading || !token} style={{
                        position: 'absolute', right: 8, top: 8, bottom: 8, width: 44, borderRadius: '50%',
                        background: '#3b82f6', border: 'none', color: '#fff', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </form>
                <div style={{ fontSize: 11, textAlign: 'center', marginTop: 12, color: '#64748b' }}>
                    RAG Intelligence is actively monitored and strictly bound to RBAC clearances.
                </div>
            </div>
            
            <style jsx>{`
                .dot-pulse { animation: fade 1.5s infinite; }
                @keyframes fade { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
            `}</style>
        </div>
    );
}
