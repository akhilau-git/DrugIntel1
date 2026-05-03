import React, { useEffect, useState } from 'react';

export default function LoadingAssembly() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(p => {
                if (p >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return p + Math.floor(Math.random() * 15);
            });
        }, 300);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: '#040b16 radial-gradient(circle at 50% 50%, #0f172a 0%, #040b16 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, color: '#fff', fontFamily: "'Segoe UI', Roboto, sans-serif"
        }}>
            <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 40 }}>
                {/* Simulated Molecular Assembly Rings */}
                <div style={ringStyle(1, '2s', '#3b82f6')} />
                <div style={ringStyle(2, '3s', '#60a5fa')} />
                <div style={ringStyle(3, '4s', '#1d4ed8')} />
                
                {/* Center Core */}
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: 40, height: 40, borderRadius: '50%', background: '#fff',
                    boxShadow: '0 0 30px #3b82f6', animation: 'pulse 1.5s ease-in-out infinite'
                }} />
            </div>

            <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 10px 0', letterSpacing: '1px' }}>
                Initializing AI-Powered Drug Discovery...
            </h2>
            <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 30, letterSpacing: '0.5px' }}>
                Establishing Secure Enterprise Connection & ML Models
            </div>

            <div style={{ width: 300, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                    transition: 'width 0.3s ease',
                    boxShadow: '0 0 10px #3b82f6'
                }} />
            </div>
            
            <div style={{ marginTop: 10, fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
                {progress < 30 ? 'Loading ADMET models...' : progress < 70 ? 'Verifying RBAC credentials...' : 'Connecting to Enterprise RAG...'}
            </div>

            <style jsx>{`
                @keyframes spin1 { 0% { transform: rotateX(60deg) rotateY(0deg) rotateZ(0deg); } 100% { transform: rotateX(60deg) rotateY(0deg) rotateZ(360deg); } }
                @keyframes spin2 { 0% { transform: rotateX(60deg) rotateY(60deg) rotateZ(0deg); } 100% { transform: rotateX(60deg) rotateY(60deg) rotateZ(360deg); } }
                @keyframes spin3 { 0% { transform: rotateX(60deg) rotateY(120deg) rotateZ(0deg); } 100% { transform: rotateX(60deg) rotateY(120deg) rotateZ(360deg); } }
                @keyframes pulse { 0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; } 50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; } }
            `}</style>
        </div>
    );
}

function ringStyle(index, duration, color) {
    return {
        position: 'absolute', inset: 0,
        border: `3px solid ${color}`,
        borderRadius: '50%',
        borderTopColor: 'transparent',
        animation: `spin${index} ${duration} linear infinite`,
        transformStyle: 'preserve-3d',
        opacity: 0.7
    }
}
