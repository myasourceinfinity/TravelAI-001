import { useState, useEffect, useCallback } from 'react';
import { getAuditLogs } from '../../services/adminService';

const EVENT_TYPES = [
  'login_success','login_failed','logout','signup',
  'agent_created','agent_status_changed','agent_role_changed',
];

const EVENT_COLORS = {
  login_success:        { bg: 'rgba(16,185,129,0.1)',  color: '#047857' },
  login_failed:         { bg: 'rgba(239,68,68,0.1)',   color: '#b91c1c' },
  agent_created:        { bg: 'rgba(79,70,229,0.1)',   color: '#4f46e5' },
  agent_status_changed: { bg: 'rgba(251,191,36,0.1)',  color: '#b45309' },
  agent_role_changed:   { bg: 'rgba(14,165,233,0.1)',  color: '#0369a1' },
  logout:               { bg: 'rgba(100,116,139,0.1)', color: '#475569' },
  signup:               { bg: 'rgba(52,211,153,0.1)',  color: '#065f46' },
};

export default function AdminAuditLogTable({ token }) {
  const [logs,      setLogs]      = useState([]);
  const [total,     setTotal]     = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState(null);

  const [eventType, setEventType] = useState('');
  const [from,      setFrom]      = useState('');
  const [to,        setTo]        = useState('');
  const [page,      setPage]      = useState(1);
  const LIMIT = 50;

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAuditLogs(token, { event_type: eventType, from, to, page, limit: LIMIT });
      setLogs(data.logs   || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token, eventType, from, to, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
        📋 Audit Logs <span style={{ fontSize: 13, color: '#64748b', fontWeight: 400 }}>({total} entries)</span>
      </h2>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={eventType} onChange={e => { setEventType(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', outline: 'none', fontSize: 13 }}
        >
          <option value="">All Events</option>
          {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input
          type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', outline: 'none', fontSize: 13 }}
        />
        <span style={{ color: '#94a3b8', fontSize: 13 }}>→</span>
        <input
          type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', outline: 'none', fontSize: 13 }}
        />
        {(eventType || from || to) && (
          <button
            onClick={() => { setEventType(''); setFrom(''); setTo(''); setPage(1); }}
            style={{ padding: '8px 12px', background: 'none', border: 'none', color: '#4f46e5', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >Clear filters</button>
        )}
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: 13 }}>⚠️ {error}</div>
      )}

      <div style={{ overflowX: 'auto', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid rgba(15,23,42,0.08)' }}>
              {['Event', 'User', 'IP', 'Metadata', 'Time'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading…</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No logs found.</td></tr>
            ) : logs.map(log => {
              const ec = EVENT_COLORS[log.event_type] || { bg: '#f1f5f9', color: '#475569' };
              return (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(15,23,42,0.05)' }}>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 700, background: ec.bg, color: ec.color }}>
                      {log.event_type}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#334155' }}>
                    {log.first_name ? `${log.first_name} ${log.last_name}` : '—'}
                    {log.email && <div style={{ fontSize: 11, color: '#94a3b8' }}>{log.email}</div>}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>{log.ip_address || '—'}</td>
                  <td style={{ padding: '10px 14px', maxWidth: 260 }}>
                    {log.metadata && Object.keys(log.metadata).length > 0 ? (
                      <code style={{ fontSize: 11, color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, wordBreak: 'break-all' }}>
                        {JSON.stringify(log.metadata)}
                      </code>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 12px', border: '1px solid rgba(15,23,42,0.15)', borderRadius: 6, background: 'white', cursor: page === 1 ? 'default' : 'pointer', color: page === 1 ? '#94a3b8' : '#0f172a' }}>← Prev</button>
          <span style={{ fontSize: 13, color: '#64748b' }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '6px 12px', border: '1px solid rgba(15,23,42,0.15)', borderRadius: 6, background: 'white', cursor: page === totalPages ? 'default' : 'pointer', color: page === totalPages ? '#94a3b8' : '#0f172a' }}>Next →</button>
        </div>
      )}
    </div>
  );
}
