/**
 * BulkPackageUpload.jsx — Shared bulk upload component
 *
 * Props:
 *   token          {string}   — JWT access token
 *   mode           {string}   — 'agent' | 'admin'
 *   providerId     {number}   — profile_id for agent mode (auto-filled)
 *   onImportSuccess {fn}      — called after a successful import
 */

import { useState, useEffect } from 'react';
import { validateBulkPackages, confirmBulkPackages } from '../../services/tripService';
import { listAdminAgents } from '../../services/adminService';

// ── Shared styles ─────────────────────────────────────────────────────────────
const chip = (color) => ({
  fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, fontWeight: 700,
  background: color === 'green' ? '#d1fae5' : '#fee2e2',
  color:      color === 'green' ? '#065f46' : '#991b1b',
});

export default function BulkPackageUpload({ token, mode = 'agent', providerId, onImportSuccess }) {
  const isAdmin = mode === 'admin';

  // ── Agent selector (admin mode only) ──────────────────────────────────────
  const [agents,           setAgents]           = useState([]);
  const [selectedAgent,    setSelectedAgent]    = useState(null); // { id, email, profile_id }
  const [agentsLoading,    setAgentsLoading]    = useState(false);

  useEffect(() => {
    if (!isAdmin || !token) return;
    setAgentsLoading(true);
    listAdminAgents(token, { status: 'active', limit: 100 })
      .then(data => setAgents(data.agents || []))
      .catch(() => {})
      .finally(() => setAgentsLoading(false));
  }, [isAdmin, token]);

  // Effective provider_id: agent's own, or selected agent in admin mode
  const effectiveProviderId = isAdmin ? selectedAgent?.profile_id : providerId;

  // ── Upload / validation state ──────────────────────────────────────────────
  const [bulkFile,             setBulkFile]             = useState(null);
  const [bulkLoading,          setBulkLoading]          = useState(false);
  const [bulkError,            setBulkError]            = useState(null);
  const [bulkSuccess,          setBulkSuccess]          = useState(null);
  const [bulkValidationErrors, setBulkValidationErrors] = useState([]);
  const [bulkParsedPackages,   setBulkParsedPackages]   = useState([]);
  const [bulkPreviewMode,      setBulkPreviewMode]      = useState(false);
  const [bulkOverwrite,        setBulkOverwrite]        = useState(false);

  function handleFileChange(e) {
    setBulkFile(e.target.files[0]);
    setBulkError(null);
    setBulkSuccess(null);
    setBulkValidationErrors([]);
  }

  async function handleBulkSubmit(e) {
    e.preventDefault();
    if (!bulkFile) { setBulkError('Please select a file first.'); return; }
    if (isAdmin && !selectedAgent) { setBulkError('Please select a target agent first.'); return; }

    setBulkLoading(true);
    setBulkError(null);
    setBulkSuccess(null);
    setBulkValidationErrors([]);
    setBulkParsedPackages([]);

    try {
      const res = await validateBulkPackages(
        token,
        bulkFile,
        bulkOverwrite,
        isAdmin ? effectiveProviderId : null
      );
      setBulkParsedPackages(res.packages || []);
      setBulkPreviewMode(true);
      if (res.invalidCount > 0) {
        setBulkError(`Validation failed on ${res.invalidCount} package(s). Review errors before confirming.`);
      }
    } catch (err) {
      if (err.details && Array.isArray(err.details)) {
        setBulkValidationErrors(err.details);
      } else {
        setBulkError(err.message || 'Bulk validation failed.');
      }
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleConfirmImport() {
    setBulkLoading(true);
    setBulkError(null);
    setBulkSuccess(null);

    try {
      let validPackages = bulkParsedPackages
        .filter(p => p.isValid)
        .map(p => p.data);

      if (validPackages.length === 0) { setBulkError('No valid packages found to import.'); return; }

      // For admin mode: ensure all packages have the correct provider_id
      if (isAdmin && effectiveProviderId) {
        validPackages = validPackages.map(p => ({ ...p, provider_id: effectiveProviderId }));
      }

      const res = await confirmBulkPackages(token, validPackages, bulkOverwrite);
      setBulkSuccess(res.message || 'Import confirmed successfully!');
      resetForm();
      onImportSuccess?.();
    } catch (err) {
      setBulkError(err.message || 'Failed to confirm import.');
    } finally {
      setBulkLoading(false);
    }
  }

  function handleCancelImport() {
    resetForm();
  }

  function resetForm() {
    setBulkFile(null);
    setBulkParsedPackages([]);
    setBulkPreviewMode(false);
    setBulkOverwrite(false);
    setBulkError(null);
    setBulkValidationErrors([]);
    const input = document.getElementById('bulk-file-input');
    if (input) input.value = '';
  }

  const validCount   = bulkParsedPackages.filter(p => p.isValid).length;
  const invalidCount = bulkParsedPackages.filter(p => !p.isValid).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
          📥 Bulk Import Packages
          {bulkPreviewMode && (
            <span style={{ fontSize: '0.75rem', background: '#e0e7ff', color: '#4f46e5', padding: '2px 8px', borderRadius: 12, marginLeft: 10, fontWeight: 600 }}>
              Preview Mode
            </span>
          )}
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
          {!bulkPreviewMode
            ? 'Upload a .csv, .xlsx, or .txt file to validate and import multiple packages at once.'
            : 'Review the parsed packages below. Valid records will be imported on confirm.'}
        </p>
      </div>

      {/* Admin: Agent selector */}
      {isAdmin && !bulkPreviewMode && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Target Agent *
          </label>
          {agentsLoading ? (
            <p style={{ fontSize: 13, color: '#94a3b8' }}>Loading agents…</p>
          ) : (
            <select
              value={selectedAgent?.profile_id || ''}
              onChange={e => {
                const agent = agents.find(a => String(a.profile_id) === e.target.value);
                setSelectedAgent(agent || null);
                setBulkError(null);
              }}
              style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', fontSize: 13, outline: 'none', background: 'white' }}
            >
              <option value="">— Select agent to import for —</option>
              {agents.map(a => (
                <option key={a.id} value={a.profile_id}>
                  {a.first_name} {a.last_name} ({a.email}) — profile #{a.profile_id}
                </option>
              ))}
            </select>
          )}
          {selectedAgent && (
            <div style={{ fontSize: 12, color: '#059669', background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.2)', borderRadius: 6, padding: '4px 10px' }}>
              ✅ Importing as: <strong>{selectedAgent.first_name} {selectedAgent.last_name}</strong> (profile_id {selectedAgent.profile_id})
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      {bulkError && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fee2e2', color: '#991b1b', fontSize: '0.85rem' }}>
          ⚠️ {bulkError}
          {bulkValidationErrors.length > 0 && (
            <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
              {bulkValidationErrors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}
      {bulkSuccess && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: '#d1fae5', color: '#065f46', fontSize: '0.85rem' }}>
          ✅ {bulkSuccess}
        </div>
      )}

      {/* Upload form */}
      {!bulkPreviewMode ? (
        <form onSubmit={handleBulkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Drop zone */}
          <div style={{ border: '2px dashed rgba(15,23,42,0.15)', borderRadius: 12, padding: '28px', textAlign: 'center', background: '#f8fafc' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: 10 }}>📁</span>
            <input
              type="file"
              id="bulk-file-input"
              accept=".csv,.xlsx,.txt"
              onChange={handleFileChange}
              style={{ display: 'block', margin: '0 auto', fontSize: 13 }}
            />
            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: 8 }}>
              Supported: .csv · .xlsx · .txt (tab or comma delimited)
            </span>
            {bulkFile && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#4f46e5', fontWeight: 600 }}>
                Selected: {bulkFile.name} ({(bulkFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          {/* Overwrite option */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', color: '#1e293b', fontWeight: 500 }}>
            <input
              type="checkbox"
              checked={bulkOverwrite}
              onChange={e => setBulkOverwrite(e.target.checked)}
              style={{ cursor: 'pointer', width: 15, height: 15 }}
            />
            🔄 Overwrite existing packages with matching names
          </label>

          <button
            type="submit"
            disabled={bulkLoading || !bulkFile || (isAdmin && !selectedAgent)}
            style={{
              padding: '12px',
              background: (bulkFile && (!isAdmin || selectedAgent)) ? 'linear-gradient(135deg, #059669, #10b981)' : '#94a3b8',
              color: 'white', border: 'none', borderRadius: 8,
              fontWeight: 700, fontSize: '0.9rem',
              cursor: (bulkFile && (!isAdmin || selectedAgent)) ? 'pointer' : 'default',
              transition: 'all 0.2s',
            }}
          >
            {bulkLoading ? '⏳ Uploading & validating…' : '🔍 Upload & Validate Preview'}
          </button>
        </form>

      ) : (
        /* Preview table */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Summary bar */}
          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid rgba(15,23,42,0.06)', display: 'flex', justifyContent: 'space-around', fontSize: '0.85rem', color: '#1e293b' }}>
            <div>Total: <strong style={{ color: '#0f172a' }}>{bulkParsedPackages.length}</strong></div>
            <div style={{ color: '#10b981' }}>Valid: <strong>{validCount}</strong></div>
            <div style={{ color: '#ef4444' }}>Invalid: <strong>{invalidCount}</strong></div>
            {isAdmin && selectedAgent && (
              <div style={{ color: '#4f46e5' }}>For: <strong>{selectedAgent.first_name} {selectedAgent.last_name}</strong></div>
            )}
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left', color: '#1e293b' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid rgba(15,23,42,0.08)' }}>
                  {['Row', 'Status', 'Package Name', 'Destination', 'Price', 'Duration', 'Errors'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', fontWeight: 700, color: '#475569', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bulkParsedPackages.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(15,23,42,0.05)', background: row.isValid ? '#ffffff' : '#fef2f2' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>{row.rowNumber}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={chip(row.isValid ? 'green' : 'red')}>{row.isValid ? 'VALID' : 'INVALID'}</span>
                      {row.isValid && row.data?.isUpdate && (
                        <span style={{ ...chip('green'), marginLeft: 4, background: '#e0f2fe', color: '#0369a1' }}>UPDATE</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{row.data?.package_name || '(Untitled)'}</td>
                    <td style={{ padding: '10px 12px', color: '#334155' }}>{row.data?.destination_name || 'N/A'}</td>
                    <td style={{ padding: '10px 12px', color: '#10b981', fontWeight: 600 }}>{row.data?.currency_code} {row.data?.base_price}</td>
                    <td style={{ padding: '10px 12px' }}>{row.data?.duration_days}d / {row.data?.duration_nights}n</td>
                    <td style={{ padding: '10px 12px', color: '#ef4444', fontSize: 12 }}>
                      {row.errors.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: 14 }}>
                          {row.errors.map((e, ei) => <li key={ei}>{e}</li>)}
                        </ul>
                      ) : <span style={{ color: '#10b981' }}>None</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleCancelImport}
              style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
            >
              ← Cancel / Upload New
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={bulkLoading || validCount === 0}
              style={{
                flex: 2, padding: '12px', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.9rem',
                background: validCount > 0 ? 'linear-gradient(135deg, #059669, #10b981)' : '#94a3b8',
                color: 'white',
                cursor: validCount > 0 ? 'pointer' : 'default',
              }}
            >
              {bulkLoading ? 'Confirming…' : `✅ Confirm Import (${validCount} valid)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
