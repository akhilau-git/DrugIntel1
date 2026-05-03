// --- PubChemInfo.jsx ---
export function PubChemInfo({ data }) {
    if (!data || data.error) return null
    return (
        <div className="card" style={{ marginTop: 20 }}>
            <h2 style={{ fontSize: 16, marginBottom: 16 }}>PubChem Database Info</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[['CID', data.cid], ['Formula', data.formula], ['IUPAC name', data.iupac_name?.slice(0, 40) + '...'],
                ['PubChem MW', data.pubchem_mw], ['Patents', data.patent_count],
                ['Active assays', data.bioactivity_summary?.active_assays]
                ].filter(([, v]) => v).map(([l, v]) => (
                    <div key={l} style={{ fontSize: 13 }}>
                        <span style={{ color: '#6b7280' }}>{l}: </span>
                        <strong>{v}</strong>
                    </div>
                ))}
            </div>
            {data.known_drug_names?.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 13 }}>
                    <strong>Known names:</strong> {data.known_drug_names.join(', ')}
                </div>
            )}
            {data.pubchem_url && (
                <a href={data.pubchem_url} target="_blank"
                    style={{ display: 'inline-block', marginTop: 12, fontSize: 13, color: '#2563eb' }}>
                    View on PubChem →
                </a>
            )}
        </div>
    )
}