import { useState, useEffect, useCallback } from 'react';
import { listPublicPackages } from '../../services/packageService';
import { listPublicAgents } from '../../services/agentService';
import PackageCard from './PackageCard';
import Navbar from '../common/Navbar';

export default function PackagesList() {
  const [packages,   setPackages]   = useState([]);
  const [total,      setTotal]      = useState(0);
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState(null);

  // Filter states
  const [destination, setDestination] = useState('');
  const [agent,       setAgent]       = useState('');
  const [costType,    setCostType]    = useState('');
  const [sort,        setSort]        = useState('price_asc');
  const [page,        setPage]        = useState(1);

  // List of agents for the dropdown
  const [agentsList, setAgentsList]   = useState([]);

  const LIMIT = 12;

  // Fetch agents list for filter dropdown
  useEffect(() => {
    listPublicAgents({ limit: 100 })
      .then(data => {
        setAgentsList(data.agents || []);
      })
      .catch(err => console.error('Failed to load agents list:', err));
  }, []);

  const fetchPackages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listPublicPackages({
        destination,
        agent,
        costType,
        sort,
        page,
        limit: LIMIT
      });
      setPackages(data.packages || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [destination, agent, costType, sort, page]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const handleResetFilters = () => {
    setDestination('');
    setAgent('');
    setCostType('');
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div style={{ background: 'linear-gradient(180deg,#eff4ff 0%,#fbfbf9 100%)', minHeight: '100vh' }}>
      <Navbar />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#1e3a8a 0%,#3b82f6 50%,#0ea5e9 100%)', padding: '48px 5% 40px', color: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Curated Travel Packages
          </h1>
          <p style={{ fontSize: 16, opacity: 0.9, margin: '0 0 28px' }}>
            Discover and customize {total} package{total !== 1 ? 's' : ''} crafted by certified travel experts.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 5%' }}>
        
        {/* Filters Panel */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          marginBottom: 32,
          border: '1px solid rgba(15,23,42,0.06)'
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>Filter Packages</h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            alignItems: 'flex-end'
          }}>
            {/* Destination Search */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Destination</label>
              <input
                type="text"
                placeholder="Where to? (e.g. Auckland)"
                value={destination}
                onChange={e => { setDestination(e.target.value); setPage(1); }}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  fontSize: 14,
                  outline: 'none',
                  background: '#f8fafc'
                }}
              />
            </div>

            {/* Agent Selector */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Travel Consultant</label>
              <select
                value={agent}
                onChange={e => { setAgent(e.target.value); setPage(1); }}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  fontSize: 14,
                  outline: 'none',
                  background: '#f8fafc'
                }}
              >
                <option value="">All Consultants</option>
                {agentsList.map(a => (
                  <option key={a.id} value={`${a.first_name} ${a.last_name}`}>
                    {a.first_name} {a.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Cost Type Selector */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Cost Type</label>
              <select
                value={costType}
                onChange={e => { setCostType(e.target.value); setPage(1); }}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  fontSize: 14,
                  outline: 'none',
                  background: '#f8fafc'
                }}
              >
                <option value="">All Price Tiers</option>
                <option value="budget">Budget (under $1,000)</option>
                <option value="midrange">Mid-Range ($1,000 - $3,000)</option>
                <option value="luxury">Luxury (over $3,000)</option>
              </select>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleResetFilters}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Sort and Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>
            Showing {packages.length} of {total} package{total !== 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>Sort by:</span>
            <select
              value={sort}
              onChange={e => { setSort(e.target.value); setPage(1); }}
              style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #cbd5e1', outline: 'none', fontSize: 13, background: 'white' }}
            >
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="duration_desc">Duration: Longest</option>
              <option value="rating_desc">Agent Rating</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        {/* Main Grid */}
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <p style={{ fontWeight: 600, color: '#64748b' }}>Loading packages…</p>
          </div>
        ) : error ? (
          <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', padding: 16, borderRadius: 12, marginBottom: 24 }}>
            {error}
          </div>
        ) : packages.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(15,23,42,0.06)', padding: '60px 20px', textAlign: 'center' }}>
            <p style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', margin: '0 0 4px' }}>No packages found</p>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Try modifying your filters or search query.</p>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
              gap: 24,
              marginBottom: 32
            }}>
              {packages.map(pkg => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 40 }}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: 'white',
                    fontWeight: 700, fontSize: 13, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1
                  }}
                >
                  Previous
                </button>
                <span style={{ fontSize: 13, color: '#475569', fontWeight: 600, margin: '0 10px' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: 'white',
                    fontWeight: 700, fontSize: 13, cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
