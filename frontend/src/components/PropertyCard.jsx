export default function PropertyCard({ data }) {
    if (!data) return null
    const { properties, admet, rules, functional_groups, molecule_image, drug_name, formula } = data
    const p = properties || {}
    const rules_data = rules || {}
    const lip = rules_data.lipinski || {}

    return (
        <div className="card">
            <h2 style={{ fontSize: 16, marginBottom: 16 }}>Molecular Properties</h2>
            {molecule_image && (
                <img src={molecule_image} alt="molecule" style={{
                    width: '100%', maxWidth: 200, borderRadius: 8,
                    border: '1px solid #e5e7eb', marginBottom: 16
                }} />
            )}
            {drug_name && <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{drug_name}</div>}
            {formula && <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>{formula}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                {[
                    ['Mol. weight', p.molecular_weight, 'Da'],
                    ['LogP', p.logP, ''],
                    ['TPSA', p.tpsa, 'Å²'],
                    ['H-bond donors', p.hbd, ''],
                    ['H-bond acceptors', p.hba, ''],
                    ['Rotatable bonds', p.rotatable_bonds, ''],
                    ['Aromatic rings', p.aromatic_rings, ''],
                    ['Fsp3', p.fsp3, ''],
                ].map(([label, val, unit]) => (
                    <div key={label} style={{ background: '#f9fafb', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{label}</div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{val ?? '—'}<span style={{ fontSize: 11, color: '#6b7280', marginLeft: 2 }}>{unit}</span></div>
                    </div>
                ))}
            </div>
            <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Lipinski's Rule of 5</div>
                {[
                    ['MW ≤ 500', lip.mw_ok],
                    ['LogP ≤ 5', lip.logp_ok],
                    ['HBD ≤ 5', lip.hbd_ok],
                    ['HBA ≤ 10', lip.hba_ok],
                ].map(([r, ok]) => (
                    <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <div style={{
                            width: 16, height: 16, borderRadius: '50%',
                            background: ok ? '#dcfce7' : '#fee2e2',
                            color: ok ? '#15803d' : '#dc2626',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10
                        }}>
                            {ok ? '✓' : '✗'}
                        </div>
                        <span style={{ fontSize: 13, color: '#374151' }}>{r}</span>
                    </div>
                ))}
                <div style={{
                    marginTop: 8, fontWeight: 600, fontSize: 14,
                    color: lip.pass ? '#15803d' : '#dc2626'
                }}>
                    {lip.pass ? 'PASS — Drug-like' : 'FAIL — Not drug-like'}
                </div>
            </div>
            {admet && (
                <div>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>ADMET profile</div>
                    <div style={{ fontSize: 13, color: '#374151' }}>
                        <div>GI absorption: <strong>{admet.gi_absorption}</strong></div>
                        <div>BBB penetrant: <strong>{admet.bbb_penetrant ? 'Yes' : 'No'}</strong></div>
                        <div>Bioavailability: <strong>{admet.bioavailability_score}%</strong></div>
                    </div>
                </div>
            )}
        </div>
    )
}