import React from 'react';

export default function MoleculeViewer({ smiles }) {
    if (!smiles) {
        return (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                Awaiting Molecular Data...
            </div>
        );
    }
    
    // Convert to URL-safe component
    const encoded = encodeURIComponent(smiles);
    const viewerUrl = `https://cactus.nci.nih.gov/chemical/structure/${encoded}/image`;

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: 20 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 14, color: '#94a3b8' }}>Molecular Visualization</h3>
            <div style={{ flex: 1, border: '1px solid #1f2937', borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img src={viewerUrl} alt="Molecular Structure" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 10, textAlign: 'right' }}>Powered by NCI/CADD Group</div>
        </div>
    );
}
