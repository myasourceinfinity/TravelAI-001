import { useState, useEffect } from 'react';
import { getAdminAgentDetail, getAdminAgentPackages, updateAgentStatus, updateAgentRole } from '../../services/adminService';

const STATUS_COLORS = {
  active:    { bg: 'rgba(16,185,129,0.1)',  color: '#047857' },
  suspended: { bg: 'rgba(239,68,68,0.1)',   color: '#b91c1c' },
  pending:   { bg: 'rgba(251,191,36,0.1)',  color: '#b45309' },
  deleted:   { bg: 'rgba(100,116,139,0.1)', color: '#475569' },
};

const ROLE_OPTIONS   = ['traveler','agent','support','admin','useradmin','superadmin'];
const STATUS_OPTIONS = ['active','suspended','pending'];

function Badge({ value, colorMap }) {
  const style = colorMap[value] || { bg: '#f1f5f9', color: '#475569' };
  return (
    <span style={{
      fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.04em',
      background: style.bg, color: style.color,
    }}>{value}</span>
  );
}

export default function AdminAgentDetail({ agentId, token, userRole, onClose, onUpdated }) {
  const [agent,    setAgent]    = useState(null);
  const [activity, setActivity] = useState([]);
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [actionMsg, setActionMsg] = useState(null);
  const [isBusy,    setIsBusy]   = useState(false);

  useEffect(() => {
    if (!agentId) return;
    setIsLoading(true);
    Promise.all([
      getAdminAgentDetail(token, agentId),
      getAdminAgentPackages(token, agentId),
    ]).then(([detail, pkgData]) => {
      setAgent(detail.agent);
      setActivity(detail.recentActivity || []);
      setPackages(pkgData.packages || []);
    }).catch(err => setActionMsg({ type: 'error', text: err.message }))
      .finally(() => setIsLoading(false));
  }, [agentId, token]);

  async function handleStatusChange(status) {
    setIsBusy(true);
    setActionMsg(null);
    try {
      const res = await updateAgentStatus(token, agentId, status);
      setAgent(prev => ({ ...prev, status: res.user.status }));
      setActionMsg({ type: 'success', text: res.message });
      onUpdated?.();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message });
    } finally { setIsBusy(false); }
  }

  async function handleRoleChange(role_type) {
    setIsBusy(true);
    setActionMsg(null);
    try {
      const res = await updateAgentRole(token, agentId, role_type);
      setAgent(prev => ({ ...prev, role_type: res.user.role_type }));
      setActionMsg({ type: 'success', text: res.message });
      onUpdated?.();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message });
    } finally { setIsBusy(false); }
  }

  const tabBtn = (id, label) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        padding: '8px 16px', border: 'none', borderRadius: 8, cursor: 'pointer',
        fontWeight: 600, fontSize: 13,
        background: activeTab === id ? 'linear-gradient(135deg,#4f46e5,#3b82f6)' : 'transparent',
        color: activeTab === id ? 'white' : '#475569',
      }}
    >{label}</button>
  );

  return (
    /* Overlay */
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 780, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(15,23,42,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
            {isLoading ? 'Loading…' : `${agent?.first_name} ${agent?.last_name}`}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}>✕</button>
        </div>

        {isLoading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Loading…</div>
        ) : (
          <>
            {/* Tabs */}
            <div style={{ padding: '12px 24px 0', display: 'flex', gap: 4, borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
              {tabBtn('profile', '👤 Profile')}
              {tabBtn('packages', `📦 Packages (${packages.length})`)}
              {tabBtn('activity', '📋 Activity')}
              {tabBtn('actions', '⚙️ Actions')}
            </div>

            {actionMsg && (
              <div style={{ margin: '12px 24px 0', padding: '10px 14px', borderRadius: 8, fontSize: 13, background: actionMsg.type === 'success' ? '#d1fae5' : '#fee2e2', color: actionMsg.type === 'success' ? '#065f46' : '#991b1b' }}>
                {actionMsg.type === 'success' ? '✅' : '⚠️'} {actionMsg.text}
              </div>
            )}

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

              {activeTab === 'profile' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#818cf8,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: 'white', fontWeight: 800 }}>
                      {agent.first_name?.[0]}{agent.last_name?.[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{agent.first_name} {agent.last_name}</div>
                      <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{agent.email}</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <Badge value={agent.status} colorMap={STATUS_COLORS} />
                        <Badge value={agent.role_type} colorMap={{}} />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    {[
                      { label: 'Total Packages', value: agent.total_packages, color: '#3b82f6' },
                      { label: 'Active Packages', value: agent.active_packages, color: '#10b981' },
                      { label: 'Draft Packages',  value: agent.draft_packages,  color: '#64748b' },
                    ].map(s => (
                      <div key={s.label} style={{ padding: 14, borderRadius: 12, background: '#f8fafc', border: '1px solid rgba(15,23,42,0.06)', textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value || 0}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                    {[
                      ['Phone', agent.phone || '—'],
                      ['Nationality', agent.nationality || '—'],
                      ['Auth', agent.auth_provider],
                      ['Verified', agent.email_verified ? 'Yes' : 'No'],
                      ['Last Login', agent.last_login_at ? new Date(agent.last_login_at).toLocaleString() : 'Never'],
                      ['Joined', new Date(agent.created_at).toLocaleDateString()],
                    ].map(([k, v]) => (
                      <div key={k} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px' }}>
                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{k}</div>
                        <div style={{ color: '#0f172a', fontWeight: 500, marginTop: 2 }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {agent.bio && (
                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#334155' }}>
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Bio</div>
                      {agent.bio}
                    </div>
                  )}

                  {Array.isArray(agent.specialties) && agent.specialties.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>Specialties</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {agent.specialties.map(s => (
                          <span key={s} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: 'rgba(79,70,229,0.08)', color: '#4f46e5', fontWeight: 600 }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'packages' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {packages.length === 0 ? (
                    <p style={{ color: '#64748b', textAlign: 'center', margin: '24px 0' }}>No packages found.</p>
                  ) : packages.map(pkg => (
                    <div key={pkg.id} style={{ padding: '12px 16px', borderRadius: 10, background: '#f8fafc', border: '1px solid rgba(15,23,42,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{pkg.package_name}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          📍 {pkg.destination_name} · {pkg.duration_days}d · {pkg.component_count} components
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#4f46e5' }}>{pkg.currency} {Number(pkg.price_per_person).toFixed(0)}</div>
                        <Badge value={pkg.status} colorMap={STATUS_COLORS} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'activity' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activity.length === 0 ? (
                    <p style={{ color: '#64748b', textAlign: 'center', margin: '24px 0' }}>No activity recorded.</p>
                  ) : activity.map((evt, i) => (
                    <div key={i} style={{ padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid rgba(15,23,42,0.05)', fontSize: 13 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{evt.event_type}</span>
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>{new Date(evt.created_at).toLocaleString()}</span>
                      </div>
                      {evt.ip_address && <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>IP: {evt.ip_address}</div>}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'actions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Status */}
                  <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 10 }}>Change Status</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {STATUS_OPTIONS.map(s => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(s)}
                          disabled={isBusy || agent.status === s}
                          style={{
                            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: agent.status === s ? 'default' : 'pointer',
                            fontWeight: 600, fontSize: 13,
                            background: agent.status === s ? '#e2e8f0' : s === 'suspended' ? '#fee2e2' : 'linear-gradient(135deg,#4f46e5,#3b82f6)',
                            color: agent.status === s ? '#94a3b8' : s === 'suspended' ? '#b91c1c' : 'white',
                          }}
                        >{s === agent.status ? `✓ ${s}` : s}</button>
                      ))}
                    </div>
                  </div>

                  {/* Role — only superadmin can assign admin-level roles */}
                  <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 10 }}>Change Role</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {ROLE_OPTIONS.map(r => {
                        const isElevated = ['admin','useradmin','superadmin'].includes(r);
                        const disabled   = isBusy || agent.role_type === r || (isElevated && userRole !== 'superadmin');
                        return (
                          <button
                            key={r}
                            onClick={() => !disabled && handleRoleChange(r)}
                            disabled={disabled}
                            title={isElevated && userRole !== 'superadmin' ? 'Only superadmin can assign this role' : ''}
                            style={{
                              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: disabled ? 'default' : 'pointer',
                              fontWeight: 600, fontSize: 13,
                              background: agent.role_type === r ? '#e2e8f0' : disabled ? '#f1f5f9' : 'linear-gradient(135deg,#4f46e5,#3b82f6)',
                              color: agent.role_type === r ? '#94a3b8' : disabled ? '#94a3b8' : 'white',
                            }}
                          >{agent.role_type === r ? `✓ ${r}` : r}</button>
                        );
                      })}
                    </div>
                    {userRole !== 'superadmin' && (
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: '8px 0 0' }}>Admin-level roles require superadmin privileges.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
