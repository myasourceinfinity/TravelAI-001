import { useState, useEffect, useCallback } from 'react';
import { listPublicAgents } from '../../services/agentService';
import AgentCard from './AgentCard';
import Navbar    from '../common/Navbar';

const SPECIALTIES = ['Luxury','Adventure','Cultural','Honeymoon','Family','Wellness','Business','Budget'];

export default function AgentsList() {
  const [agents,    setAgents]    = useState([]);
  const [total,     setTotal]     = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState(null);

  const [q,         setQ]         = useState('');
  const [specialty, setSpecialty] = useState('');
  const [sort,      setSort]      = useState('name_asc');
  const [page,      setPage]      = useState(1);
  const LIMIT = 12;

  const fetchAgents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listPublicAgents({ q, specialty, sort, page, limit: LIMIT });
      setAgents(data.agents || []);
      setTotal(data.total  || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [q, specialty, sort, page]);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div style={{ background: 'linear-gradient(180deg,#eff4ff 0%,#fbfbf9 100%)', minHeight: '100vh' }}>
      <Navbar />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#3730a3 0%,#1d4ed8 60%,#0ea5e9 100%)', padding: '48px 5% 40px', color: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 900, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Our Travel Agents</h1>
          <p style={{ fontSize: 15, opacity: 0.85, margin: '0 0 28px' }}>
            {total} expert consultant{total !== 1 ? 's' : ''} ready to craft your perfect journey
          </p>

          {/* Hero search */}
          <div style={{ display: 'flex', gap: 10, maxWidth: 560, flexWrap: 'wrap' }}>
            <input
              value={q}
              onChange={e => { setQ(e.target.value); setPage(1); }}
              placeholder="Search agents by name or specialty…"
              style={{ flex: 1, minWidth: 200, padding: '12px 16px', borderRadius: 10, border: 'none', fontSize: 14, outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
            />
            <button
              onClick={() => { setPage(1); fetchAgents(); }}
              style={{ padding: '12px 20px', background: 'white', color: '#4f46e5', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
            >Search</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 5%' }}>

        {/* Specialty filter pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
          <button
            onClick={() => { setSpecialty(''); setPage(1); }}
            style={{
              padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 13,
              background: specialty === '' ? 'linear-gradient(135deg,#4f46e5,#3b82f6)' : '#f1f5f9',
              color: specialty === '' ? 'white' : '#475569',
            }}
          >All</button>
          {SPECIALTIES.map(s => (
            <button
              key={s}
              onClick={() => { setSpecialty(s === specialty ? '' : s); setPage(1); }}
              style={{
                padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: 13,
                background: specialty === s ? 'linear-gradient(135deg,#4f46e5,#3b82f6)' : '#f1f5f9',
                color: specialty === s ? 'white' : '#475569',
              }}
            >{s}</button>
          ))}

          {/* Sort */}
          <select
            value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}
            style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', outline: 'none', fontSize: 13, background: 'white' }}
          >
            <option value="name_asc">Name A–Z</option>
            <option value="name_desc">Name Z–A</option>
            <option value="packages_desc">Most Packages</option>
            <option value="newest">Newest</option>
          </select>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>⚠️ {error}</div>
        )}

        {/* Agent grid */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <p>Loading agents…</p>
          </div>
        ) : agents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p style={{ fontWeight: 600 }}>No agents found</p>
            <p style={{ fontSize: 13 }}>Try adjusting your search or specialty filter.</p>
            {(q || specialty) && (
              <button
                onClick={() => { setQ(''); setSpecialty(''); setPage(1); }}
                style={{ marginTop: 12, padding: '8px 20px', background: 'linear-gradient(135deg,#4f46e5,#3b82f6)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
              >Clear Filters</button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {agents.map(agent => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center', marginTop: 32 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '8px 16px', border: '1px solid rgba(15,23,42,0.15)', borderRadius: 8, background: 'white', cursor: page === 1 ? 'default' : 'pointer', color: page === 1 ? '#94a3b8' : '#0f172a', fontWeight: 600 }}>← Prev</button>
            <span style={{ fontSize: 14, color: '#64748b' }}>Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '8px 16px', border: '1px solid rgba(15,23,42,0.15)', borderRadius: 8, background: 'white', cursor: page === totalPages ? 'default' : 'pointer', color: page === totalPages ? '#94a3b8' : '#0f172a', fontWeight: 600 }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
