interface HomeFiltersProps {
    showFilters: boolean;
    filters: { minAge: string; maxAge: string; gender: string; minScore: string };
    setFilters: (filters: any) => void;
    applyFilters: () => void;
}

export const HomeFilters = ({ showFilters, filters, setFilters, applyFilters }: HomeFiltersProps) => {
    if (!showFilters) return null;

    return (
        <div className="glass-panel" style={{ padding: 16, marginBottom: 20, animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>Filtreler</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Min Yaş</label>
                    <input type="number" placeholder="18" value={filters.minAge} onChange={e => setFilters({ ...filters, minAge: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--card-border)', padding: '6px', borderRadius: 6, fontSize: 13 }} />
                </div>
                <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Maks Yaş</label>
                    <input type="number" placeholder="50" value={filters.maxAge} onChange={e => setFilters({ ...filters, maxAge: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--card-border)', padding: '6px', borderRadius: 6, fontSize: 13 }} />
                </div>
            </div>

            <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Cinsiyet</label>
                <select value={filters.gender} onChange={e => setFilters({ ...filters, gender: e.target.value })} style={{ width: '100%', background: '#1c1c24', color: 'white', border: '1px solid var(--card-border)', padding: '6px', borderRadius: 6, fontSize: 13 }}>
                    <option value="ALL">Tümü</option>
                    <option value="MALE">Erkek</option>
                    <option value="FEMALE">Kadın</option>
                    <option value="NON_BINARY">Diğer</option>
                </select>
            </div>

            <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Min. Uyum Skoru</label>
                <input type="range" min="0" max="100" value={filters.minScore || 0} onChange={e => setFilters({ ...filters, minScore: e.target.value })} style={{ width: '100%', accentColor: 'var(--accent-gold)' }} />
                <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--accent-gold)' }}>%{filters.minScore || '0'}</div>
            </div>

            <button
                onClick={applyFilters}
                style={{ width: '100%', padding: '8px', background: 'var(--accent-purple)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 'bold' }}
            >
                Uygula
            </button>
        </div>
    );
};
