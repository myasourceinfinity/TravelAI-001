import { useNavigate } from 'react-router-dom';

const SPECIALTY_COLORS = {
  Luxury:     { bg: 'rgba(168,85,247,0.1)',  color: '#7c3aed' },
  Adventure:  { bg: 'rgba(239,68,68,0.1)',   color: '#b91c1c' },
  Cultural:   { bg: 'rgba(14,165,233,0.1)',  color: '#0369a1' },
  Honeymoon:  { bg: 'rgba(236,72,153,0.1)',  color: '#be185d' },
  Family:     { bg: 'rgba(251,191,36,0.1)',  color: '#b45309' },
  Wellness:   { bg: 'rgba(52,211,153,0.1)',  color: '#065f46' },
  Business:   { bg: 'rgba(100,116,139,0.1)', color: '#475569' },
  Budget:     { bg: 'rgba(16,185,129,0.1)',  color: '#047857' },
};

export default function AgentCard({ agent }) {
  const navigate = useNavigate();
  const initials = `${agent.first_name?.[0] || ''}${agent.last_name?.[0] || ''}`.toUpperCase();
  const specialties = Array.isArray(agent.specialties) ? agent.specialties : [];

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid rgba(15,23,42,0.08)',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      transition: 'all 0.2s',
      display: 'flex',
      flexDirection: 'column',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(79,70,229,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Card Body */}
      <div style={{ padding: '20px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
          {/* Avatar */}
          {agent.avatar_url ? (
            <img src={agent.avatar_url} alt={initials} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#818cf8,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'white', fontWeight: 800, flexShrink: 0 }}>
              {initials || '?'}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>
              {agent.first_name} {agent.last_name}
            </div>
            {agent.nationality && (
              <div style={{ fontSize: 12, color: '#64748b' }}>📍 {agent.nationality}</div>
            )}
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              📦 {agent.active_packages || 0} active package{agent.active_packages !== 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 4, fontWeight: 700 }}>
              ⭐ {Number(agent.average_rating) > 0 ? Number(agent.average_rating).toFixed(1) : 'New'}
              <span style={{ color: '#64748b', fontWeight: 500, marginLeft: 6 }}>
                {Number(agent.review_count) > 0
                  ? `(${agent.review_count} review${Number(agent.review_count) !== 1 ? 's' : ''})`
                  : '(No reviews yet)'}
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {agent.bio && (
          <p style={{ fontSize: 13, color: '#475569', margin: '0 0 12px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {agent.bio}
          </p>
        )}

        {/* Specialties */}
        {specialties.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
            {specialties.slice(0, 4).map(s => {
              const sc = SPECIALTY_COLORS[s] || { bg: '#f1f5f9', color: '#475569' };
              return (
                <span key={s} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600, background: sc.bg, color: sc.color }}>{s}</span>
              );
            })}
            {specialties.length > 4 && (
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#94a3b8' }}>+{specialties.length - 4}</span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(15,23,42,0.06)', background: '#f8fafc', marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => navigate(`/agents/${agent.id}`)}
          style={{ padding: '8px 18px', background: 'linear-gradient(135deg,#4f46e5,#3b82f6)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        >
          View Profile →
        </button>
      </div>
    </div>
  );
}
