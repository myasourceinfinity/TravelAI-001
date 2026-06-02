/**
 * AgentPackages.jsx
 *
 * Shown on PlanTripWithTravelAI after AI generates a plan.
 * Fetches agent packages matching the trip destinations and lets the
 * user mix-and-match components with a live price calculator.
 *
 * Props:
 *   destinations {Array}  — from plan.destinations (must have .name)
 *   travelers    {number} — number of travellers (for price calc)
 *   token        {string} — JWT access token
 *   onSelection  {fn}     — called with { selectedComponents, totalPerPerson, totalAll }
 *                           whenever the selection changes
 */

import { useState, useEffect, useCallback } from 'react';

const TYPE_META = {
  flight:   { icon: '✈️', label: 'Flight',   colour: '#38bdf8' },
  hotel:    { icon: '🏨', label: 'Hotel',    colour: '#a78bfa' },
  activity: { icon: '🎯', label: 'Activity', colour: '#34d399' },
  transfer: { icon: '🚌', label: 'Transfer', colour: '#fb923c' },
};

function ComponentRow({ comp, checked, onChange }) {
  const meta = TYPE_META[comp.componentType] || { icon: '📦', label: comp.componentType, colour: '#94a3b8' };
  return (
    <label style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '12px 14px',
      borderRadius: 8,
      background: checked ? `${meta.colour}11` : 'transparent',
      border: `1px solid ${checked ? meta.colour + '55' : 'var(--glass-border)'}`,
      cursor: 'pointer',
      transition: 'all 0.15s',
      marginBottom: 6,
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(comp.id, e.target.checked)}
        style={{ marginTop: 3, accentColor: meta.colour, width: 16, height: 16, flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 16 }}>{meta.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>{comp.title}</span>
          <span style={{
            fontSize: 10, padding: '1px 7px', borderRadius: 999,
            background: `${meta.colour}22`, color: meta.colour,
            border: `1px solid ${meta.colour}44`, textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {meta.label}
          </span>
          {!comp.isIncluded && (
            <span style={{
              fontSize: 10, padding: '1px 7px', borderRadius: 999,
              background: '#fb923c22', color: '#fb923c',
              border: '1px solid #fb923c44',
            }}>Add-on</span>
          )}
        </div>
        {comp.description && (
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-secondary, #94a3b8)' }}>
            {comp.description}
          </p>
        )}
        {comp.provider && (
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>
            Provider: {comp.provider}
          </p>
        )}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: meta.colour }}>
          NZD ${Number(comp.pricePerPerson).toFixed(2)}
        </div>
        <div style={{ fontSize: 10, color: '#64748b' }}>per person</div>
      </div>
    </label>
  );
}

function PackageCard({ pkg, travelers, selectedComponents, onToggle }) {
  const [expanded, setExpanded] = useState(true);

  const selectedFromThis = pkg.components.filter(c => selectedComponents[c.id]);
  const subtotal = selectedFromThis.reduce((sum, c) => sum + Number(c.pricePerPerson), 0);
  const subtotalAll = subtotal * travelers;

  return (
    <div style={{
      background: 'var(--bg-800, #1e293b)',
      border: '1px solid var(--glass-border)',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 16,
    }}>
      {/* Package header */}
      <div
        onClick={() => setExpanded(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', cursor: 'pointer',
          background: 'var(--bg-900, #0f172a)',
          gap: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>
              {pkg.package_name}
            </span>
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 999,
              background: '#38bdf822', color: '#38bdf8', border: '1px solid #38bdf844',
            }}>
              📍 {pkg.destination_name}
            </span>
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 999,
              background: '#34d39922', color: '#34d399', border: '1px solid #34d39944',
            }}>
              {pkg.duration_days} Days
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary, #94a3b8)', maxWidth: 600 }}>
            {pkg.description}
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Full package from</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#38bdf8' }}>
            NZD ${Number(pkg.price_per_person).toFixed(0)}
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>per person</div>
        </div>
        <span style={{ fontSize: 18, color: '#64748b', marginLeft: 8 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {/* Components list */}
      {expanded && (
        <div style={{ padding: '16px 20px' }}>

          {/* Select all / none shortcuts */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 11, padding: '3px 10px' }}
              onClick={() => pkg.components.forEach(c => onToggle(c.id, true))}
            >
              ✓ Select All
            </button>
            <button
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 11, padding: '3px 10px' }}
              onClick={() => pkg.components.forEach(c => onToggle(c.id, false))}
            >
              ✕ Clear All
            </button>
          </div>

          {/* Group by type */}
          {['flight', 'hotel', 'activity', 'transfer'].map(type => {
            const comps = pkg.components.filter(c => c.componentType === type);
            if (comps.length === 0) return null;
            const meta = TYPE_META[type];
            return (
              <div key={type} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: meta.colour, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                  {meta.icon} {meta.label}s
                </div>
                {comps.map(comp => (
                  <ComponentRow
                    key={comp.id}
                    comp={comp}
                    checked={!!selectedComponents[comp.id]}
                    onChange={onToggle}
                  />
                ))}
              </div>
            );
          })}

          {/* Package subtotal */}
          {selectedFromThis.length > 0 && (
            <div style={{
              marginTop: 12, padding: '12px 16px', borderRadius: 8,
              background: 'var(--bg-900, #0f172a)',
              border: '1px solid #38bdf844',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary, #94a3b8)' }}>
                {selectedFromThis.length} item{selectedFromThis.length !== 1 ? 's' : ''} selected from this package
              </span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: '#38bdf8', fontWeight: 700 }}>
                  NZD ${subtotal.toFixed(2)} <span style={{ fontWeight: 400, fontSize: 11 }}>pp</span>
                  {travelers > 1 && (
                    <span style={{ marginLeft: 8, fontSize: 12, color: '#64748b' }}>
                      (${subtotalAll.toFixed(2)} total for {travelers})
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function AgentPackages({ destinations, travelers = 1, token, onSelection }) {
  const [packages,   setPackages]   = useState([]);
  const [isLoading,  setIsLoading]  = useState(false);
  const [error,      setError]      = useState(null);

  // { [componentId]: componentObject } for every checked component
  const [selected, setSelected] = useState({});

  // ── Fetch matching packages whenever destinations change ─────────────────
  useEffect(() => {
    if (!destinations || destinations.length === 0) return;
    const destNames = destinations.map(d => d.name).filter(Boolean).join(',');
    if (!destNames) return;

    setIsLoading(true);
    setError(null);
    setSelected({});

    fetch(
      `${import.meta.env.VITE_API_BASE_URL || '/api'}/packages?destinations=${encodeURIComponent(destNames)}`,
      { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' }
    )
      .then(r => r.json())
      .then(data => {
        setPackages(data.packages || []);
        // Pre-select all included components by default
        const defaults = {};
        (data.packages || []).forEach(pkg => {
          pkg.components.forEach(c => {
            if (c.isIncluded) defaults[c.id] = c;
          });
        });
        setSelected(defaults);
      })
      .catch(() => setError('Could not load agent packages.'))
      .finally(() => setIsLoading(false));
  }, [destinations, token]);

  // ── Notify parent whenever selection changes ──────────────────────────────
  useEffect(() => {
    const selectedComponents = Object.values(selected);
    const totalPerPerson = selectedComponents.reduce((s, c) => s + Number(c.pricePerPerson), 0);
    onSelection?.({ selectedComponents, totalPerPerson, totalAll: totalPerPerson * travelers });
  }, [selected, travelers, onSelection]);

  const handleToggle = useCallback((componentId, checked) => {
    // Find the component object from packages
    let found = null;
    for (const pkg of packages) {
      found = pkg.components.find(c => c.id === componentId);
      if (found) break;
    }
    if (!found) return;

    setSelected(prev => {
      const next = { ...prev };
      if (checked) next[componentId] = found;
      else delete next[componentId];
      return next;
    });
  }, [packages]);

  // ── Grand total ───────────────────────────────────────────────────────────
  const selectedList   = Object.values(selected);
  const grandPerPerson = selectedList.reduce((s, c) => s + Number(c.pricePerPerson), 0);
  const grandTotal     = grandPerPerson * travelers;

  if (isLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <span className="spinner" style={{ width: 24, height: 24, display: 'inline-block' }} />
        <p style={{ fontSize: 13, color: 'var(--text-secondary, #94a3b8)', marginTop: 8 }}>
          Checking available packages…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '12px 16px', fontSize: 13, color: '#f87171' }}>⚠️ {error}</div>
    );
  }

  if (packages.length === 0) return null; // No matching packages — render nothing

  return (
    <div style={{ marginTop: '2rem' }}>

      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>
            🏷️ Available Agent Packages
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary, #94a3b8)' }}>
            {packages.length} package{packages.length !== 1 ? 's' : ''} found matching your destinations.
            Select the components you want — mix and match with your AI plan.
          </p>
        </div>

        {/* Grand total pill */}
        {selectedList.length > 0 && (
          <div style={{
            padding: '10px 18px', borderRadius: 10,
            background: '#38bdf822', border: '1px solid #38bdf844',
            textAlign: 'right',
          }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>
              {selectedList.length} item{selectedList.length !== 1 ? 's' : ''} selected
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#38bdf8' }}>
              NZD ${grandPerPerson.toFixed(2)} <span style={{ fontWeight: 400, fontSize: 12 }}>pp</span>
            </div>
            {travelers > 1 && (
              <div style={{ fontSize: 12, color: '#64748b' }}>
                ${grandTotal.toFixed(2)} for {travelers} travelers
              </div>
            )}
          </div>
        )}
      </div>

      {/* Package cards */}
      {packages.map(pkg => (
        <PackageCard
          key={pkg.id}
          pkg={pkg}
          travelers={travelers}
          selectedComponents={selected}
          onToggle={handleToggle}
        />
      ))}

      {/* Summary bar */}
      {selectedList.length > 0 && (
        <div style={{
          padding: '16px 20px', borderRadius: 10, marginTop: 8,
          background: 'var(--bg-900, #0f172a)',
          border: '1px solid #38bdf8',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>
              Your selected agent components:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {selectedList.map(c => {
                const meta = TYPE_META[c.componentType] || { icon: '📦', colour: '#94a3b8' };
                return (
                  <span key={c.id} style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 999,
                    background: `${meta.colour}22`, color: meta.colour,
                    border: `1px solid ${meta.colour}44`,
                  }}>
                    {meta.icon} {c.title}
                  </span>
                );
              })}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#38bdf8' }}>
              NZD ${grandPerPerson.toFixed(2)}
              <span style={{ fontSize: 13, fontWeight: 400, color: '#64748b', marginLeft: 4 }}>per person</span>
            </div>
            {travelers > 1 && (
              <div style={{ fontSize: 14, color: 'var(--text-secondary, #94a3b8)' }}>
                NZD ${grandTotal.toFixed(2)} total for {travelers} {travelers === 1 ? 'traveler' : 'travelers'}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
