import React, { useState, useEffect } from 'react';
import { fetchReport } from '../../services/api';

export default function InteractionExplanation({ modelRunId, ddiResult }) {
  const [expanded, setExpanded] = useState(false);
  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    setReport(null);
    setExpanded(false);
  }, [modelRunId]);

  async function toggleExpand() {
    if (!expanded && !report && modelRunId) {
      setLoadingReport(true);
      try {
        const data = await fetchReport(modelRunId);
        setReport(data);
      } catch { /* silent */ }
      setLoadingReport(false);
    }
    setExpanded(!expanded);
  }

  if (!ddiResult) return null;

  return (
    <section className="pd-card" role="region" aria-label="Interaction Explanation">
      <div className="pd-card-header">
        <h2 className="pd-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:8,verticalAlign:'middle',opacity:0.6}}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          Mechanism & Explainability
        </h2>
      </div>
      <div className="pd-card-body">
        <p className="pd-explain-summary">
          {ddiResult.mechanism || 'No mechanism data available.'}
        </p>

        <button className="pd-expand-btn" onClick={toggleExpand}>
          {expanded ? '▾ Hide technical details' : '▸ Show technical details'}
        </button>

        {expanded && (
          <div className="pd-tech-details">
            <div style={{fontSize:13,fontWeight:600,color:'#374151',marginBottom:8}}>
              Top contributing features
            </div>

            {loadingReport ? (
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <div className="pd-skeleton" style={{height:18,width:'80%'}}></div>
                <div className="pd-skeleton" style={{height:18,width:'65%'}}></div>
              </div>
            ) : report?.shap_values ? (
              <ul className="pd-shap-list">
                {report.shap_values.map((s, i) => (
                  <li key={i}>
                    <span>{s.feature}</span>
                    <span className="pd-shap-value" style={{
                      color: parseFloat(s.value) > 0 ? '#DC2626' : '#16A34A'
                    }}>{s.value}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{fontSize:13,color:'#6B7280'}}>No SHAP data available.</p>
            )}

            <div className="pd-provenance">
              Model {report?.model_version || 'v1.2'} • last run {report?.timestamp || 'just now'} • Confidence {ddiResult.confidence}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
