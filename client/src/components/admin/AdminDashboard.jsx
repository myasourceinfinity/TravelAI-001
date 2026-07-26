import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAdminStats } from '../../services/adminService';
import Navbar              from '../common/Navbar';
import AdminAgentsList     from './AdminAgentsList';
import AdminAuditLogTable  from './AdminAuditLogTable';
import BulkPackageUpload   from '../common/BulkPackageUpload';

function StatCard({ label, value, sub, color, bg, icon, onClick, isActive }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '20px', borderRadius: 16, background: '#ffffff',
        border: `2px solid ${isActive ? color : 'rgba(15,23,42,0.08)'}`,
        boxShadow: isActive ? `0 4px 20px ${bg}` : '0 4px 20px rgba(15,23,42,0.03)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.18s',
        transform: isActive ? 'translateY(-2px)' : 'none',
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { if (onClick && !isActive) e.currentTarget.style.transform = 'none'; }}
    >
      <div>
        <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: '2rem', fontWeight: 800, color, marginTop: 4 }}>{value ?? '—'}</div>
        {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, accessToken } = useAuth();

  const [activeTab,    setActiveTab]    = useState('agents');
  const [stats,        setStats]        = useState(null);
  const [statsErr,     setStatsErr]     = useState(null);

  // Lifted filter state — driven by stat card clicks
  const [agentFilter,  setAgentFilter]  = useState({ status: 'all', sort: 'created_at_desc' });
  const [auditFilter,  setAuditFilter]  = useState({ eventType: '' });
  const [activeCard,   setActiveCard]   = useState(null); // tracks which card is highlighted

  function handleCardClick(tab, agentOpts, auditOpts, cardKey) {
    setActiveTab(tab);
    setActiveCard(cardKey);
    if (agentOpts) setAgentFilter(prev => ({ ...prev, ...agentOpts }));
    if (auditOpts) setAuditFilter(prev => ({ ...prev, ...auditOpts }));
  }

  const fetchStats = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await getAdminStats(accessToken);
      setStats(data);
    } catch (err) {
      setStatsErr(err.message);
    }
  }, [accessToken]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const navBtn = (id, label) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        background: activeTab === id ? 'linear-gradient(135deg,#4f46e5,#3b82f6)' : 'transparent',
        color: activeTab === id ? 'white' : '#475569',
        border: 'none', borderRadius: 10, padding: '12px 16px', cursor: 'pointer',
        fontWeight: 600, fontSize: 14, textAlign: 'left', transition: 'all 0.2s',
      }}
    >{label}</button>
  );

  const agentStats = stats?.agents || {};
  const pkgStats   = stats?.packages || {};

  return (
    <div style={{ display: 'block', background: 'linear-gradient(180deg,#eff4ff 0%,#fbfbf9 100%)', minHeight: '100vh', padding: 0 }}>
      <Navbar />
      <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', padding: '2rem 5%' }}>

        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: '#ffffff', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 16, boxShadow: '0 4px 20px rgba(15,23,42,0.05)', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#818cf8,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'white', fontWeight: 800 }}>🛡️</div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Admin Dashboard
              </h1>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0' }}>
                {user?.email} ·{' '}
                <span style={{ background: 'linear-gradient(135deg,#6366f1,#3b82f6)', color: 'white', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700, textTransform: 'uppercase' }}>{user?.role_type}</span>
              </p>
            </div>
          </div>
        </header>

        {/* Analytics Stats */}
        {statsErr && (
          <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>⚠️ Stats unavailable: {statsErr}</div>
        )}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: '1.5rem' }}>
          <StatCard
            label="Total Agents" value={agentStats.total} color="#3b82f6" bg="rgba(59,130,246,0.1)" icon="🧑‍💼"
            isActive={activeCard === 'all'}
            onClick={() => handleCardClick('agents', { status: 'all', sort: 'created_at_desc' }, null, 'all')}
          />
          <StatCard
            label="Active Agents" value={agentStats.byStatus?.active ?? 0} color="#10b981" bg="rgba(16,185,129,0.1)" icon="✅"
            isActive={activeCard === 'active'}
            onClick={() => handleCardClick('agents', { status: 'active', sort: 'created_at_desc' }, null, 'active')}
          />
          <StatCard
            label="Suspended" value={agentStats.byStatus?.suspended ?? 0} color="#ef4444" bg="rgba(239,68,68,0.1)" icon="🚫"
            isActive={activeCard === 'suspended'}
            onClick={() => handleCardClick('agents', { status: 'suspended', sort: 'created_at_desc' }, null, 'suspended')}
          />
          <StatCard
            label="Total Packages" value={pkgStats.total_packages} color="#4f46e5" bg="rgba(79,70,229,0.1)" icon="📦"
            isActive={activeCard === 'total_packages'}
            onClick={() => handleCardClick('agents', { status: 'all', sort: 'total_packages_desc' }, null, 'total_packages')}
          />
          <StatCard
            label="Active Packages" value={pkgStats.active_packages} color="#059669" bg="rgba(5,150,105,0.1)" icon="🟢"
            sub={`${pkgStats.agents_with_packages ?? 0} agents with packages`}
            isActive={activeCard === 'active_packages'}
            onClick={() => handleCardClick('agents', { status: 'active', sort: 'total_packages_desc' }, null, 'active_packages')}
          />
          <StatCard
            label="Logins (7d)" value={stats?.loginsLast7Days} color="#0369a1" bg="rgba(3,105,161,0.1)" icon="🔐"
            isActive={activeCard === 'logins'}
            onClick={() => handleCardClick('audit', null, { eventType: 'login_success' }, 'logins')}
          />
        </section>

        {/* Workspace */}
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' }}>

          {/* Sidebar */}
          <div style={{ padding: 16, background: '#ffffff', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 16, boxShadow: '0 4px 20px rgba(15,23,42,0.02)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {navBtn('agents',    '🧑‍💼  Agents')}
            {navBtn('audit',     '📋  Audit Logs')}
            {navBtn('analytics', '📊  Analytics')}
            {navBtn('bulk',      '📥  Bulk Import')}
          </div>

          {/* Content */}
          <div style={{ padding: 24, background: '#ffffff', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 16, boxShadow: '0 4px 20px rgba(15,23,42,0.04)', minHeight: 400 }}>

            {activeTab === 'agents' && (
              <AdminAgentsList
                token={accessToken}
                userRole={user?.role_type}
                statusFilter={agentFilter.status}
                sortFilter={agentFilter.sort}
                onFilterChange={() => setActiveCard(null)}
              />
            )}

            {activeTab === 'audit' && (
              <AdminAuditLogTable
                token={accessToken}
                eventTypeFilter={auditFilter.eventType}
                onFilterChange={() => setActiveCard(null)}
              />
            )}

            {activeTab === 'bulk' && (
              <BulkPackageUpload
                token={accessToken}
                mode="admin"
                onImportSuccess={fetchStats}
              />
            )}

            {activeTab === 'analytics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>📊 Platform Analytics</h2>

                {/* Agent status breakdown */}
                <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 14 }}>Agent Status Breakdown</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {Object.entries(agentStats.byStatus || {}).map(([status, count]) => (
                      <div key={status} style={{ flex: '1 1 120px', padding: 16, background: 'white', borderRadius: 10, border: '1px solid rgba(15,23,42,0.06)', textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: status === 'active' ? '#10b981' : status === 'suspended' ? '#ef4444' : '#64748b' }}>{count}</div>
                        <div style={{ fontSize: 12, color: '#64748b', textTransform: 'capitalize', marginTop: 2 }}>{status}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Package stats */}
                <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 14 }}>Package Summary</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                    {[
                      { label: 'Total', value: pkgStats.total_packages,    color: '#4f46e5' },
                      { label: 'Active', value: pkgStats.active_packages,  color: '#10b981' },
                      { label: 'Draft',  value: pkgStats.draft_packages,   color: '#64748b' },
                      { label: 'Archived', value: pkgStats.archived_packages, color: '#94a3b8' },
                    ].map(s => (
                      <div key={s.label} style={{ padding: 16, background: 'white', borderRadius: 10, border: '1px solid rgba(15,23,42,0.06)', textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value ?? 0}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Signup trend */}
                {stats?.signupTrend?.length > 0 && (
                  <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 14 }}>New Agent Signups — Last 30 Days</div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', overflowX: 'auto', paddingBottom: 4 }}>
                      {stats.signupTrend.map(d => {
                        const maxCount = Math.max(...stats.signupTrend.map(x => parseInt(x.count)));
                        const height   = maxCount > 0 ? Math.max(4, (parseInt(d.count) / maxCount) * 80) : 4;
                        return (
                          <div key={d.day} title={`${d.day}: ${d.count}`} style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 10, color: '#64748b' }}>{d.count}</span>
                            <div style={{ width: 20, height, background: 'linear-gradient(180deg,#4f46e5,#3b82f6)', borderRadius: '3px 3px 0 0' }} />
                            <span style={{ fontSize: 9, color: '#94a3b8', transform: 'rotate(-45deg)', transformOrigin: 'top left', marginTop: 8, whiteSpace: 'nowrap' }}>
                              {new Date(d.day).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
