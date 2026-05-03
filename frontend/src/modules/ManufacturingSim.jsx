import React, { useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function ManufacturingSim({ smiles }) {
    const [temp, setTemp] = useState(70);
    const [pressure, setPressure] = useState(1.5);
    const [time, setTime] = useState(12);
    
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(false);

    const runSimulation = async () => {
        if (!smiles) return;
        setLoading(true);
        try {
            const res = await axios.post(`${API}/manufacturing/simulate`, {
                smiles, temp_c: temp, pressure_atm: pressure, time_hrs: time
            });
            setMetrics(res.data);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    return (
        <div style={{ padding: 40, width: '100%', overflowY: 'auto' }}>
            <h2>Manufacturing Batch Simulation 🏭</h2>
            <p style={{ color: '#94a3b8', marginBottom: 30 }}>Predict yield, purity, and cost metrics before physical scale-up.</p>

            {!smiles ? (
                <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: 16, borderRadius: 8 }}>
                    <strong>Warning:</strong> No molecule loaded. Go to the Discovery tab and input a SMILES sequence first.
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                    
                    {/* Controls */}
                    <div style={{ background: '#111827', padding: 24, borderRadius: 8, border: '1px solid #1f2937' }}>
                        <h3 style={{ marginTop: 0 }}>Reactor Parameters</h3>
                        
                        <Control label="Temperature (°C)" value={temp} set={setTemp} min={20} max={150} />
                        <Control label="Pressure (atm)" value={pressure} set={setPressure} min={1.0} max={5.0} step={0.1} />
                        <Control label="Reaction Time (hrs)" value={time} set={setTime} min={1} max={48} />
                        
                        <button 
                            onClick={runSimulation} disabled={loading}
                            style={{ 
                                width: '100%', padding: 12, marginTop: 24, borderRadius: 6, border: 'none',
                                background: loading ? '#475569' : '#3b82f6', color: '#fff', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'Simulating Physics...' : 'Run Thermodynamics Model'}
                        </button>
                    </div>

                    {/* Results */}
                    <div style={{ background: '#111827', padding: 24, borderRadius: 8, border: '1px solid #1f2937' }}>
                        <h3 style={{ marginTop: 0 }}>Process Metrics</h3>
                        {metrics ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <Metric label="Predicted Batch Yield" value={`${metrics.predicted_yield_pct}%`} color={metrics.predicted_yield_pct > 80 ? '#34d399' : '#fbbf24'} />
                                <Metric label="Est. Cost" value={`$${metrics.estimated_cost_per_g_usd}/g`} color="#f8fafc" />
                                <Metric label="Energy Consumption" value={`${metrics.energy_consumption_kwh} kWh`} color="#f8fafc" />
                                <div style={{ 
                                    padding: 12, borderRadius: 6, marginTop: 10,
                                    background: metrics.status === 'OPTIMAL' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                    color: metrics.status === 'OPTIMAL' ? '#34d399' : '#fbbf24', border: `1px solid ${metrics.status === 'OPTIMAL' ? '#34d399' : '#fbbf24'}`
                                }}>
                                    <strong>Status:</strong> {metrics.status} (Confidence: {metrics.confidence_score_pct}%)
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: '#475569' }}>Run the simulation to calculate industrial metrics.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function Control({ label, value, set, min, max, step=1 }) {
    return (
        <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                <label style={{ color: '#cbd5e1' }}>{label}</label>
                <span style={{ fontWeight: 'bold' }}>{value}</span>
            </div>
            <input 
                type="range" min={min} max={max} step={step} value={value} 
                onChange={(e) => set(Number(e.target.value))} 
                style={{ width: '100%', accentColor: '#3b82f6', cursor: 'grab' }}
            />
        </div>
    );
}

function Metric({ label, value, color }) {
    return (
        <div style={{ background: '#1e293b', padding: 16, borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8', fontSize: 14 }}>{label}</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: color }}>{value}</span>
        </div>
    );
}
