import { useState, useEffect, useCallback } from 'react';
import { listAdminAgents } from '../../services/adminService';
import AdminAgentDetail from './AdminAgentDetail';
import CreateAgentForm  from './CreateAgentForm';

const STATUS_COLORS = {
  active:    { bg: 'rgba(16,185,129,0.1)',  color: '#047857' },
  suspended: { bg: 'rgba(239,68,68,0.1)',   color: '#b91c1c' },
  pending:   { bg: 'rgba(251,191,36,0.1)',  color: '#b45309' },
  deleted:   { bg: 'rgba(100,116,139,0.1)', color: '#475569' },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: '#f1f5f9', color: '#475569' };
  return (
    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 700, textTransform: 'uppercase', background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

export default function AdminAgentsList({ token, userRole }) {
  const [agents,      setAgents]      = useState([]);
  const [total,       setTotal]       = useState(0);
  const [isLoading,   setIsLoading]   = useState(true);
  const [error,       setError]       = useState(null);

  const [q,           setQ]           = useState('');
  const [statusFilter,setStatusFilter]= useState('all');
  const [page,        setPage]        = useState(1);
  const LIMIT = 20;

  const [selectedId,  setSelectedId]  = useState(null);   // detail modal
  const [showCreate,  setShowCreate]  = useState(false);  // create modal

  const fetchAgents = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await listAdminAgents(token, { q, status: statusFilter, page, limit: LIMIT });
      setAgents(data.agents || []);
      setTotal(data.total  || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token, q, statusFilter, page]);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    fetchAgents();
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
          🧑‍💼 Agents <span style={{ fontSize: 13, color: '#64748b', fontWeight: 400 }}>({total} total)</span>
        </h2>
        <button
          onClick={() => setShowCreate(true)}
          style={{ padding: '8px 16px', background: 'linear-gradient(135deg,#4f46e5,#3b82f6)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        >
          ➕ Create Agent
        </button>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
          placeholder="Search name or email…"
          style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', outline: 'none', fontSize: 13 }}
        />
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', outline: 'none', fontSize: 13 }}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending">Pending</option>
        </select>
        <button type="submit" style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          🔍 Search
        </button>
      </form>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: 13 }}>⚠️ {error}</div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid rgba(15,23,42,0.08)' }}>
              {['Agent', 'Email', 'Status', 'Packages', 'Last Login', 'Joined', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading…</td></tr>
            ) : agents.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No agents found.</td></tr>
            ) : agents.map(agent => (
              <tr
                key={agent.id}
                style={{ borderBottom: '1px solid rgba(15,23,42,0.05)', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#818cf8,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'white', fontWeight: 700, flexShrink: 0 }}>
                      {agent.first_name?.[0]}{agent.last_name?.[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{agent.first_name} {agent.last_name}</div>
                      {Array.isArray(agent.specialties) && agent.specialties.length > 0 && (
                        <div style={{ fontSize: 11, color: '#4f46e5', marginTop: 1 }}>{agent.specialties.slice(0,2).join(' · ')}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 14px', color: '#334155', whiteSpace: 'nowrap' }}>{agent.email}</td>
                <td style={{ padding: '12px 14px' }}><StatusBadge status={agent.status} /></td>
                <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#4f46e5' }}>{agent.total_packages || 0}</span>
                  <span style={{ color: '#94a3b8', fontSize: 11 }}> ({agent.active_packages || 0} active)</span>
                </td>
                <td style={{ padding: '12px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>
                  {agent.last_login_at ? new Date(agent.last_login_at).toLocaleDateString() : 'Never'}
                </td>
                <td style={{ padding: '12px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>
                  {new Date(agent.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <button
                    onClick={() => setSelectedId(agent.id)}
                    style={{ padding: '6px 12px', background: 'rgba(79,70,229,0.08)', color: '#4f46e5', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
                  >View →</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 12px', border: '1px solid rgba(15,23,42,0.15)', borderRadius: 6, background: 'white', cursor: page === 1 ? 'default' : 'pointer', color: page === 1 ? '#94a3b8' : '#0f172a' }}>← Prev</button>
          <span style={{ fontSize: 13, color: '#64748b' }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '6px 12px', border: '1px solid rgba(15,23,42,0.15)', borderRadius: 6, background: 'white', cursor: page === totalPages ? 'default' : 'pointer', color: page === totalPages ? '#94a3b8' : '#0f172a' }}>Next →</button>
        </div>
      )}

      {/* Agent detail modal */}
      {selectedId && (
        <AdminAgentDetail
          agentId={selectedId}
          token={token}
          userRole={userRole}
          onClose={() => setSelectedId(null)}
          onUpdated={fetchAgents}
        />
      )}

      {/* Create agent modal */}
      {showCreate && (
        <div
          onClick={() => setShowCreate(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 560, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <CreateAgentForm
              token={token}
              onSuccess={fetchAgents}
              onCancel={() => setShowCreate(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
