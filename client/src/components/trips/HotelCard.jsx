/**
 * HotelCard.jsx
 * Renders a single hotel offer as a selectable card.
 *
 * Props:
 *   hotel    {object}  — from bookingController summarizeHotels
 *   selected {boolean}
 *   onSelect {fn}
 */

function StarRating({ score, stars }) {
  const count = stars || (score >= 9 ? 5 : score >= 8 ? 4 : 3);
  return (
    <span style={{ color: '#fbbf24', fontSize: 12, letterSpacing: -1 }}>
      {'★'.repeat(Math.min(count, 5))}{'☆'.repeat(Math.max(0, 5 - Math.min(count, 5)))}
    </span>
  );
}

export default function HotelCard({ hotel: h, selected, onSelect }) {
  function fmtPrice(price, currency = 'NZD') {
    if (price == null) return 'N/A';
    return new Intl.NumberFormat('en-NZ', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price);
  }

  const imgSrc = h.photo_url || `https://picsum.photos/seed/${encodeURIComponent(h.hotel_id || h.name)}/260/180`;
  const overBudget = !!h.overBudget;

  return (
    <div
      onClick={onSelect}
      style={{
        background:   selected ? 'rgba(56,189,248,0.06)' : 'rgba(15,23,42,0.6)',
        border:       `1px solid ${selected ? '#38bdf8' : overBudget ? '#fbbf2455' : '#334155'}`,
        borderRadius: 12,
        overflow:     'hidden',
        cursor:       'pointer',
        transition:   'all 0.2s',
        display:      'flex',
        boxShadow:    selected ? '0 0 0 2px rgba(56,189,248,0.25)' : 'none',
      }}
    >
      {/* Photo */}
      <div style={{ width: 120, flexShrink: 0, position: 'relative', background: '#1e293b' }}>
        <img
          src={imgSrc}
          alt={h.name}
          loading="lazy"
          onError={e => { e.target.src = `https://picsum.photos/seed/${encodeURIComponent(h.name)}/260/180`; }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {selected && (
          <div style={{ position: 'absolute', top: 6, left: 6, background: '#38bdf8', color: '#0f172a', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6 }}>✓ SELECTED</div>
        )}
        {!selected && overBudget && (
          <div style={{ position: 'absolute', top: 6, left: 6, background: '#fbbf24', color: '#0f172a', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6 }}>OVER BUDGET</div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#f1f5f9', marginBottom: 5, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {h.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
            <StarRating score={h.review_score} stars={h.stars} />
            {h.review_score != null && (
              <span style={{ background: '#10b981', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 5 }}>
                {h.review_score.toFixed(1)}
              </span>
            )}
            {h.review_count && (
              <span style={{ fontSize: 11, color: '#64748b' }}>{h.review_count} reviews</span>
            )}
          </div>
          {h.free_cancellation && (
            <div style={{ fontSize: 11, color: '#34d399', fontWeight: 600, marginBottom: 6 }}>✓ Free cancellation</div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: selected ? '#38bdf8' : overBudget ? '#fbbf24' : '#34d399', fontFamily: 'serif' }}>
              {fmtPrice(h.price, h.currency)}
            </div>
            <div style={{ fontSize: 10, color: '#64748b' }}>total stay{overBudget ? ' · above budget' : ''}</div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onSelect(); }}
            style={{
              background:   selected ? 'rgba(56,189,248,0.15)' : 'rgba(56,189,248,0.08)',
              border:       `1px solid ${selected ? '#38bdf8' : '#334155'}`,
              color:        selected ? '#38bdf8' : '#94a3b8',
              borderRadius: 8,
              padding:      '4px 10px',
              fontSize:     11,
              fontWeight:   600,
              cursor:       'pointer',
            }}
          >
            {selected ? 'Selected ✓' : 'Select'}
          </button>
        </div>
      </div>
    </div>
  );
}
