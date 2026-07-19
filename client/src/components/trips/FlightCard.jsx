/**
 * FlightCard.jsx
 * Renders a single flight offer as a selectable card.
 *
 * Props:
 *   flight   {object}  — from bookingController summarizeFlights
 *   selected {boolean} — whether this flight is selected by the user
 *   onSelect {fn}      — called when user clicks the card
 *   index    {number}  — used to badge BEST / CHEAPEST
 *   cheapestPrice {number} — lowest price among all offers for this leg
 */

export default function FlightCard({ flight: f, selected, onSelect, index, cheapestPrice }) {
  const isBest     = index === 0;
  const isCheapest = f.price != null && f.price === cheapestPrice && index !== 0;
  const overBudget = !!f.overBudget;

  function fmtTime(iso) {
    if (!iso) return '--:--';
    try { return new Date(iso).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit', hour12: false }); }
    catch { return iso.slice(11, 16) || '--:--'; }
  }

  function fmtDuration(mins) {
    if (!mins) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  }

  function fmtPrice(price, currency = 'NZD') {
    if (price == null) return 'N/A';
    return new Intl.NumberFormat('en-NZ', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price);
  }

  // Pick airline emoji
  const airlineEmojis = { 'Air New Zealand': '🇳🇿', 'Qantas': '🦘', 'Jetstar': '⭐', 'Emirates': '🇦🇪', 'Singapore Airlines': '🦁' };
  const emoji = airlineEmojis[f.airline] || '✈️';
  const accentColor = selected ? '#38bdf8' : '#334155';

  return (
    <div
      onClick={onSelect}
      style={{
        background:    selected ? 'rgba(56,189,248,0.08)' : 'rgba(15,23,42,0.6)',
        border:        `1px solid ${accentColor}`,
        borderRadius:  12,
        padding:       '14px 16px',
        cursor:        'pointer',
        transition:    'all 0.2s',
        flexShrink:    0,
        width:         260,
        position:      'relative',
        boxShadow:     selected ? '0 0 0 2px rgba(56,189,248,0.3)' : 'none',
      }}
    >
      {/* Badges */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {isBest && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#10b981', color: '#fff' }}>BEST</span>
        )}
        {isCheapest && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#fbbf24', color: '#0f172a' }}>CHEAPEST</span>
        )}
        {f.is_direct && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid #34d39944' }}>DIRECT</span>
        )}
        {overBudget && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#fbbf24', color: '#0f172a' }}>OVER BUDGET</span>
        )}
        {selected && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'rgba(56,189,248,0.2)', color: '#38bdf8', border: '1px solid #38bdf844', marginLeft: 'auto' }}>✓ SELECTED</span>
        )}
      </div>

      {/* Airline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{emoji}</div>
        <span style={{ fontWeight: 600, fontSize: 13, color: '#f1f5f9' }}>{f.airline || 'Airline'}</span>
      </div>

      {/* Route */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ textAlign: 'center', minWidth: 56 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#f8fafc', lineHeight: 1 }}>{fmtTime(f.departure_time)}</div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, letterSpacing: '0.03em' }}>{f.origin_code}</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{ width: '100%', height: 1, background: 'linear-gradient(90deg, #38bdf8, #818cf8)', position: 'relative' }}>
            <span style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', fontSize: 12, color: '#38bdf8' }}>✈</span>
          </div>
          <div style={{ fontSize: 9, color: '#64748b' }}>
            {f.is_direct ? 'Nonstop' : `${f.stops} stop${f.stops === 1 ? '' : 's'}`}
            {f.duration_minutes ? ` · ${fmtDuration(f.duration_minutes)}` : ''}
          </div>
        </div>
        <div style={{ textAlign: 'center', minWidth: 56 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#f8fafc', lineHeight: 1 }}>{fmtTime(f.arrival_time)}</div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, letterSpacing: '0.03em' }}>{f.destination_code}</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: selected ? '#38bdf8' : overBudget ? '#fbbf24' : '#34d399', fontFamily: 'serif' }}>{fmtPrice(f.price, f.currency)}</div>
          <div style={{ fontSize: 10, color: '#64748b' }}>total price{overBudget ? ' · above budget' : ''}</div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onSelect(); }}
          style={{
            background: selected ? 'rgba(56,189,248,0.15)' : 'rgba(56,189,248,0.08)',
            border:     `1px solid ${selected ? '#38bdf8' : '#334155'}`,
            color:      selected ? '#38bdf8' : '#94a3b8',
            borderRadius: 8,
            padding:    '4px 12px',
            fontSize:   11,
            fontWeight: 600,
            cursor:     'pointer',
          }}
        >
          {selected ? 'Selected ✓' : 'Select'}
        </button>
      </div>
    </div>
  );
}
