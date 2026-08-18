import { useNavigate } from 'react-router-dom';

const PACKAGE_TYPE_COLORS = {
  adventure: { bg: 'rgba(239,68,68,0.1)', color: '#b91c1c' },
  leisure: { bg: 'rgba(14,165,233,0.1)', color: '#0369a1' },
  honeymoon: { bg: 'rgba(236,72,153,0.1)', color: '#be185d' },
  family: { bg: 'rgba(251,191,36,0.1)', color: '#b45309' },
  wellness: { bg: 'rgba(52,211,153,0.1)', color: '#065f46' },
  business: { bg: 'rgba(100,116,139,0.1)', color: '#475569' },
  custom: { bg: 'rgba(168,85,247,0.1)', color: '#7c3aed' },
  cultural: { bg: 'rgba(16,185,129,0.1)', color: '#047857' },
};

function StarRating({ rating, count }) {
  const rounded = Math.round(Number(rating) * 2) / 2;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
      <div style={{ display: 'flex', gap: 1 }}>
        {[1, 2, 3, 4, 5].map(star => {
          const isFilled = star <= rounded;
          return (
            <span
              key={star}
              style={{
                color: isFilled ? '#f59e0b' : '#e2e8f0',
                fontSize: 16,
                lineHeight: 1
              }}
            >
              ★
            </span>
          );
        })}
      </div>
      <span style={{ fontWeight: 700, color: '#0f172a', marginLeft: 4 }}>
        {Number(rating) > 0 ? Number(rating).toFixed(1) : 'New'}
      </span>
      <span style={{ color: '#64748b', fontSize: 12 }}>
        {Number(count) > 0 ? `(${count})` : '(No reviews)'}
      </span>
    </div>
  );
}

export default function PackageCard({ pkg }) {
  const navigate = useNavigate();
  const initials = `${pkg.agent_first_name?.[0] || ''}${pkg.agent_last_name?.[0] || ''}`.toUpperCase();
  const typeColor = PACKAGE_TYPE_COLORS[pkg.package_type?.toLowerCase()] || { bg: '#f1f5f9', color: '#475569' };

  // Calculate price tier class or text
  let costLabel = 'Mid-Range';
  let costColor = '#3b82f6';
  const price = pkg.promo_price ? Number(pkg.promo_price) : Number(pkg.price_per_person);
  if (price < 1000) {
    costLabel = 'Budget';
    costColor = '#10b981';
  } else if (price > 3000) {
    costLabel = 'Luxury';
    costColor = '#8b5cf6';
  }

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
      {/* Header Image or destination banner */}
      <div style={{
        height: 120,
        background: 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: 'white',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '3px 8px',
            borderRadius: 6,
            backdropFilter: 'blur(4px)',
            textTransform: 'capitalize'
          }}>
            📍 {pkg.destination_name}
          </span>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            background: typeColor.bg,
            color: typeColor.color,
            padding: '3px 8px',
            borderRadius: 6,
            textTransform: 'capitalize'
          }}>
            {pkg.package_type}
          </span>
        </div>
        <div style={{ zIndex: 1 }}>
          <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {pkg.package_name}
          </h3>
        </div>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.15, backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.4) 0%, transparent 60%)' }} />
      </div>

      {/* Card Body */}
      <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Rating and review info */}
        <div style={{ marginBottom: 12 }}>
          <StarRating rating={pkg.average_rating} count={pkg.review_count} />
        </div>

        {/* Summary Description */}
        {pkg.summary && (
          <p style={{ fontSize: 13, color: '#475569', margin: '0 0 16px', lineHeight: 1.5, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {pkg.summary}
          </p>
        )}

        {/* Cost Type and details */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Cost Type</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: costColor }}>{costLabel}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {pkg.promo_price ? (
              <>
                <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 800 }}>🔥 Sale (per traveler)</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#dc2626' }}>
                  {pkg.currency} {Number(pkg.promo_price).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', textDecoration: 'line-through' }}>
                  {pkg.currency} {Number(pkg.price_per_person).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 11, color: '#64748b' }}>Price (per traveler)</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>
                  {pkg.currency} {Number(pkg.price_per_person).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Agent Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
          {pkg.agent_avatar_url ? (
            <img src={pkg.agent_avatar_url} alt={pkg.agent_first_name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#818cf8,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'white', fontWeight: 800 }}>
              {initials}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#64748b' }}>Travel Consultant</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pkg.agent_first_name} {pkg.agent_last_name}
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(15,23,42,0.06)', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => navigate(`/packages/${pkg.id}`)}
          style={{ width: '100%', padding: '8px 16px', background: 'linear-gradient(135deg,#4f46e5,#3b82f6)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'opacity 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          View Package Details & Enquiry
        </button>
      </div>
    </div>
  );
}
