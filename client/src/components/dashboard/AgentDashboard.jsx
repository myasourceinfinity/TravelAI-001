import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getProfile, updateProfile } from '../../services/authService';
import { getAgentPackages, createSinglePackage, updateSinglePackage } from '../../services/tripService';
import Navbar from '../common/Navbar';
import BulkPackageUpload from '../common/BulkPackageUpload';
import { getAgentEnquiries, addEnquiryFollowUp } from '../../services/recentPackageService';

const COMPONENT_META = {
  flight: { icon: '✈️', label: 'Flight', colour: '#0284c7' },
  hotel: { icon: '🏨', label: 'Hotel', colour: '#7c3aed' },
  activity: { icon: '🎯', label: 'Activity', colour: '#059669' },
  transfer: { icon: '🚌', label: 'Transfer', colour: '#d97706' },
};

function PackageCard({ pkg, onEdit }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid rgba(15, 23, 42, 0.08)',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 16,
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.02)',
      transition: 'all 0.2s',
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(prev => !prev)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', cursor: 'pointer',
          background: 'rgba(15, 23, 42, 0.015)',
          gap: 12,
          flexWrap: 'wrap'
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              {pkg.package_name}
            </span>
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 999,
              background: 'rgba(56, 189, 248, 0.08)', color: '#0369a1', border: '1px solid rgba(56, 189, 248, 0.15)',
            }}>
              📍 {pkg.destination_name}
            </span>
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 999,
              background: 'rgba(52, 211, 153, 0.08)', color: '#047857', border: '1px solid rgba(52, 211, 153, 0.15)',
            }}>
              {pkg.duration_days}d / {pkg.duration_nights}n
            </span>
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 999,
              background: pkg.status === 'active' ? 'rgba(52, 211, 153, 0.08)' : 'rgba(148, 163, 184, 0.08)',
              color: pkg.status === 'active' ? '#047857' : '#475569',
              border: `1px solid ${pkg.status === 'active' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(148, 163, 184, 0.15)'}`,
              textTransform: 'uppercase',
              fontWeight: 'bold'
            }}>
              {pkg.status}
            </span>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#475569', maxWidth: 650 }}>
            {pkg.summary || pkg.description}
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {pkg.promo_price ? (
            <>
              <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 700, marginBottom: 2 }}>🔥 Promo Price</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#dc2626' }}>
                {pkg.currency} ${Number(pkg.promo_price).toFixed(0)}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', textDecoration: 'line-through' }}>
                Was {pkg.currency} ${Number(pkg.price_per_person).toFixed(0)}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 2 }}>Base Price</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#4f46e5' }}>
                {pkg.currency} ${Number(pkg.price_per_person).toFixed(0)}
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>per person</div>
            </>
          )}
        </div>
        <span style={{ fontSize: 18, color: '#64748b', marginLeft: 8 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {/* Components list */}
      {expanded && (
        <div style={{ padding: '20px', background: 'rgba(15, 23, 42, 0.005)', borderTop: '1px solid rgba(15, 23, 42, 0.06)' }}>
          <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: 12, letterSpacing: '0.05em' }}>
            Package Inclusions ({pkg.components?.length || 0} items)
          </h4>
          {pkg.components?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pkg.components.map((comp, idx) => {
                const meta = COMPONENT_META[comp.componentType] || { icon: '📦', colour: '#475569' };
                return (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderRadius: 8,
                    background: '#f8fafc',
                    border: '1px solid rgba(15, 23, 42, 0.05)',
                    gap: 12,
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 18 }}>{meta.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                          {comp.title}
                          {!comp.isIncluded && (
                            <span style={{ fontSize: 10, background: 'rgba(251, 146, 60, 0.15)', color: '#c2410c', padding: '1px 6px', borderRadius: 4, fontWeight: 'bold' }}>Add-on</span>
                          )}
                        </div>
                        {comp.description && (
                          <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{comp.description}</div>
                        )}
                        {comp.provider && (
                          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Provider: {comp.provider}</div>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: meta.colour }}>
                        {pkg.currency} ${Number(comp.pricePerPerson).toFixed(2)}
                      </span>
                      <div style={{ fontSize: 10, color: '#64748b' }}>per person</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>No components defined for this package.</p>
          )}

          {onEdit && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, borderTop: '1px solid rgba(15,23,42,0.06)', paddingTop: 12 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(pkg);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', color: 'white',
                  border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12,
                  fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(79,70,229,0.2)'
                }}
              >
                ✏️ Edit Package Details
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AgentDashboard() {
  const navigate = useNavigate();
  const { user, accessToken, logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [packages, setPackages] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState(null);
  const [error, setError] = useState(null);

  // Package creation tabs and form states
  const [activeTab, setActiveTab] = useState('packages'); // 'packages' | 'create' | 'bulk'

  const getInitialPkgState = (profileId) => ({
    provider_id: profileId || '',
    provider_type: 'Agent',
    destination_name: '',
    package_name: '',
    package_type: 'Leisure',
    travel_mode: 'Flight',
    summary: '',
    description: '',
    duration_days: '',
    duration_nights: '',
    base_price: '',
    promo_price: '',
    currency_code: 'NZD',
    platform_service_fee_type: 'fixed',
    platform_service_fee_value: '0',
    min_travelers: '1',
    max_travelers: '4',
    is_customizable: true,
    status: 'draft',
    is_active: true
  });

  const [newPkg, setNewPkg] = useState(getInitialPkgState(null));
  const [pkgError, setPkgError] = useState(null);
  const [pkgSuccess, setPkgSuccess] = useState(null);
  const [pkgValidationErrors, setPkgValidationErrors] = useState([]);

  const [editingPkgId, setEditingPkgId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const [enquiries, setEnquiries] = useState([]);
  const [enquiriesLoading, setEnquiriesLoading] = useState(false);
  const [noteTextInputs, setNoteTextInputs] = useState({});
  const [noteTypeInputs, setNoteTypeInputs] = useState({});
  const [savingNotes, setSavingNotes] = useState({});
  const [notesError, setNotesError] = useState({});
  const [notesSuccess, setNotesSuccess] = useState({});

  const fetchEnquiries = useCallback(async () => {
    if (!accessToken) return;
    setEnquiriesLoading(true);
    try {
      const data = await getAgentEnquiries(accessToken);
      const enqs = data.enquiries || [];
      setEnquiries(enqs);

      // Initialize note types to 'note'
      const initialTypes = {};
      enqs.forEach(enq => {
        initialTypes[enq.id] = 'note';
      });
      setNoteTypeInputs(initialTypes);
    } catch (err) {
      console.error('[AgentDashboard] Failed to fetch enquiries:', err);
    } finally {
      setEnquiriesLoading(false);
    }
  }, [accessToken]);

  const handleAddFollowUp = async (enquiryId) => {
    const noteText = noteTextInputs[enquiryId] || '';
    const noteType = noteTypeInputs[enquiryId] || 'note';

    if (!noteText.trim()) {
      setNotesError(prev => ({ ...prev, [enquiryId]: 'Please enter note text.' }));
      return;
    }

    setSavingNotes(prev => ({ ...prev, [enquiryId]: true }));
    setNotesError(prev => ({ ...prev, [enquiryId]: null }));
    setNotesSuccess(prev => ({ ...prev, [enquiryId]: null }));

    try {
      const res = await addEnquiryFollowUp(accessToken, enquiryId, { noteType, noteText });
      setNotesSuccess(prev => ({ ...prev, [enquiryId]: 'Follow-up logged successfully!' }));
      setNoteTextInputs(prev => ({ ...prev, [enquiryId]: '' })); // Clear input

      // Append the new follow-up to the enquiry's local follow_ups array
      setEnquiries(prevEnqs =>
        prevEnqs.map(e => {
          if (e.id === enquiryId) {
            return {
              ...e,
              follow_ups: [res.followUp, ...(e.follow_ups || [])]
            };
          }
          return e;
        })
      );
    } catch (err) {
      setNotesError(prev => ({ ...prev, [enquiryId]: err.message || 'Failed to log follow-up.' }));
    } finally {
      setSavingNotes(prev => ({ ...prev, [enquiryId]: false }));
    }
  };

  useEffect(() => {
    if (activeTab === 'enquiries') {
      fetchEnquiries();
    }
  }, [activeTab, fetchEnquiries]);

  const fetchProfileAndPackages = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const [profileData, packagesData] = await Promise.all([
        getProfile(accessToken),
        getAgentPackages(accessToken),
      ]);
      setProfile(profileData.user);
      setForm(buildFormState(profileData.user));
      setPackages(packagesData.packages || []);

      // Update newPkg provider_id
      if (profileData.user?.profile_id) {
        setNewPkg(prev => ({ ...prev, provider_id: profileData.user.profile_id }));
      }
    } catch (err) {
      if (err.status === 401) {
        await logout();
        navigate('/login?reason=session-expired');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, logout, navigate]);

  useEffect(() => { fetchProfileAndPackages(); }, [fetchProfileAndPackages]);

  function buildFormState(p) {
    return {
      first_name: p.first_name || '',
      last_name: p.last_name || '',
      phone: p.phone || '',
      dob: p.dob ? p.dob.slice(0, 10) : '',
      nationality: p.nationality || '',
      bio: p.bio || '',
    };
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setSaveMsg(null);
  }

  function handleCancel() {
    setForm(buildFormState(profile));
    setIsEditing(false);
    setSaveMsg(null);
  }

  async function handleSave() {
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const data = await updateProfile(accessToken, form);
      setProfile(data.user);
      setForm(buildFormState(data.user));
      setIsEditing(false);
      setSaveMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setSaveMsg({ type: 'error', text: err.message || 'Failed to save changes.' });
    } finally {
      setIsSaving(false);
    }
  }

  function handlePkgChange(e) {
    const { name, value, type, checked } = e.target;
    let finalValue = value;
    if (type === 'checkbox') {
      finalValue = checked;
    } else if (name === 'is_customizable' || name === 'is_active') {
      finalValue = value === 'true';
    }
    setNewPkg(prev => ({ ...prev, [name]: finalValue }));
    setPkgError(null);
    setPkgSuccess(null);
  }

  async function handlePkgSubmit(e) {
    e.preventDefault();
    setPkgError(null);
    setPkgSuccess(null);
    setPkgValidationErrors([]);
    setIsSaving(true);
    try {
      if (editingPkgId) {
        const res = await updateSinglePackage(accessToken, editingPkgId, newPkg);
        setPkgSuccess(res.message || 'Package updated successfully!');
        setEditingPkgId(null);
        setNewPkg(getInitialPkgState(profile?.profile_id));
        setActiveTab('packages');
      } else {
        const res = await createSinglePackage(accessToken, newPkg);
        setPkgSuccess(res.message || 'Package created successfully!');
        setNewPkg(getInitialPkgState(profile?.profile_id));
      }
      const packagesData = await getAgentPackages(accessToken);
      setPackages(packagesData.packages || []);
    } catch (err) {
      setPkgError(err.message || 'Failed to process package.');
      if (err.details && Array.isArray(err.details)) {
        setPkgValidationErrors(err.details);
      }
    } finally {
      setIsSaving(false);
    }
  }

  function handleStartEdit(pkg) {
    setEditingPkgId(pkg.id);
    setNewPkg({
      provider_id: pkg.provider_id,
      provider_type: pkg.provider_type || 'Agent',
      destination_name: pkg.destination_name,
      package_name: pkg.package_name,
      package_type: pkg.package_type || 'Leisure',
      travel_mode: pkg.travel_mode || 'Flight',
      summary: pkg.summary || '',
      description: pkg.description || '',
      duration_days: pkg.duration_days,
      duration_nights: pkg.duration_nights,
      base_price: pkg.price_per_person,
      promo_price: pkg.promo_price || '',
      currency_code: pkg.currency || 'NZD',
      platform_service_fee_type: pkg.platform_service_fee_type || 'fixed',
      platform_service_fee_value: pkg.platform_service_fee_value || '0',
      min_travelers: pkg.min_travelers || '1',
      max_travelers: pkg.max_travelers || '4',
      is_customizable: pkg.is_customizable !== false,
      status: pkg.status || 'draft',
      is_active: pkg.is_active !== false
    });
    setPkgError(null);
    setPkgSuccess(null);
    setActiveTab('create');
  }

  function handleCancelEdit() {
    setEditingPkgId(null);
    setNewPkg(getInitialPkgState(profile?.profile_id));
    setPkgError(null);
    setPkgSuccess(null);
    setActiveTab('packages');
  }


  if (isLoading) {
    return (
      <div className="dashboard-page page-bg" style={{ background: 'linear-gradient(180deg, #eff4ff 0%, #fbfbf9 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="dashboard-loader" style={{ textAlign: 'center' }}>
          <span className="spinner" style={{ width: 32, height: 32, display: 'inline-block' }} />
          <p style={{ color: '#64748b', marginTop: 16 }}>Loading Agent Dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page page-bg" style={{ background: 'linear-gradient(180deg, #eff4ff 0%, #fbfbf9 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-card" style={{ padding: '24px', borderRadius: 16, background: '#ffffff', border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <p style={{ color: '#ef4444' }}>⚠️ {error}</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={fetchProfileAndPackages}>Retry</button>
        </div>
      </div>
    );
  }

  const initials = `${(profile?.first_name?.[0] || '').toUpperCase()}${(profile?.last_name?.[0] || '').toUpperCase()}`;
  const totalPackages = packages.length;
  const activePackages = packages.filter(p => p.status === 'active').length;
  const draftPackages = packages.filter(p => p.status === 'draft').length;

  const filteredPackages = packages.filter(pkg => {
    if (statusFilter === 'all') return true;
    return pkg.status?.toLowerCase() === statusFilter;
  });

  return (
    <div className="dashboard-page page-bg" style={{ display: 'block', background: 'linear-gradient(180deg, #eff4ff 0%, #fbfbf9 100%)', minHeight: '100vh', padding: 0 }}>
      <Navbar />
      <div className="dashboard-container" style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '2rem 5%' }}>

        {/* ═══ Header ═══════════════════════════════════════════════════════════ */}
        <header className="dashboard-header glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: '#ffffff', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 16, boxShadow: '0 4px 20px rgba(15,23,42,0.05)', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="avatar-circle" style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#818cf8,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'white', fontWeight: 'bold' }}>👤</div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Agent Dashboard: <span style={{ background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{profile?.first_name}</span>
              </h1>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0' }}>
                {profile?.email} · <span style={{ background: 'linear-gradient(135deg,#6366f1,#3b82f6)', color: 'white', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 'bold', textTransform: 'uppercase' }}>{profile?.role_type}</span>
              </p>
            </div>
          </div>
        </header>

        {saveMsg && (
          <div style={{ padding: '12px 16px', borderRadius: 8, background: saveMsg.type === 'success' ? '#d1fae5' : '#fee2e2', color: saveMsg.type === 'success' ? '#065f46' : '#991b1b', marginBottom: 16 }}>
            {saveMsg.type === 'success' ? '✅' : '⚠️'} {saveMsg.text}
          </div>
        )}

        {/* ═══ Stats Section ═══════════════════════════════════════════════════ */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: '2rem', alignItems: 'stretch' }}>
          {[
            { label: 'Total Packages', count: totalPackages, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', filterVal: 'all' },
            { label: 'Active Packages', count: activePackages, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', filterVal: 'active' },
            { label: 'Draft Packages', count: draftPackages, color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)', filterVal: 'draft' }
          ].map((stat, i) => {
            const isSelected = statusFilter === stat.filterVal;
            return (
              <div 
                key={i} 
                onClick={() => {
                  setStatusFilter(stat.filterVal);
                  setActiveTab('packages');
                }}
                style={{ 
                  padding: '20px', 
                  borderRadius: 16, 
                  background: '#ffffff', 
                  border: '2px solid ' + (isSelected ? stat.color : 'rgba(15,23,42,0.08)'), 
                  boxShadow: isSelected ? '0 8px 30px rgba(15,23,42,0.08)' : '0 4px 20px rgba(15,23,42,0.03)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{stat.label}</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: stat.color, marginTop: 4 }}>{stat.count}</div>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {stat.filterVal === 'active' ? '✅' : stat.filterVal === 'draft' ? '📝' : '📦'}
                </div>
              </div>
            );
          })}
        </section>

        {/* ═══ Workspace Sidebar Grid ══════════════════════════════════════════ */}
        <div className="agent-dashboard-workspace">
          
          {/* Left Column: Sidebar Navigation */}
          <div className="glass-card agent-dashboard-sidebar" style={{ padding: '16px', background: '#ffffff', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 16, boxShadow: '0 4px 20px rgba(15,23,42,0.02)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button 
              onClick={() => {
                setActiveTab('packages');
                setPkgError(null);
                setPkgSuccess(null);
              }} 
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                background: activeTab === 'packages' ? 'linear-gradient(135deg, #4f46e5, #3b82f6)' : 'transparent',
                color: activeTab === 'packages' ? '#ffffff' : '#475569',
                border: 'none', borderRadius: 10, padding: '12px 16px', cursor: 'pointer',
                fontWeight: 600, fontSize: 14, transition: 'all 0.2s', textAlign: 'left'
              }}
            >
              <span style={{ fontSize: 16 }}>📦</span> My Packages
            </button>
            
            <button 
              onClick={() => {
                setActiveTab('create');
                setPkgError(null);
                setPkgSuccess(null);
                if (!editingPkgId && profile?.profile_id) {
                  setNewPkg(prev => ({ ...prev, provider_id: profile.profile_id }));
                }
              }} 
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                background: activeTab === 'create' ? 'linear-gradient(135deg, #4f46e5, #3b82f6)' : 'transparent',
                color: activeTab === 'create' ? '#ffffff' : '#475569',
                border: 'none', borderRadius: 10, padding: '12px 16px', cursor: 'pointer',
                fontWeight: 600, fontSize: 14, transition: 'all 0.2s', textAlign: 'left'
              }}
            >
              <span style={{ fontSize: 16 }}>{editingPkgId ? '✏️' : '➕'}</span> 
              {editingPkgId ? 'Edit Package' : 'Create Package'}
            </button>

            <button 
              onClick={() => {
                setActiveTab('bulk');
                setPkgError(null);
                setPkgSuccess(null);
                if (profile?.profile_id) {
                  setNewPkg(prev => ({ ...prev, provider_id: profile.profile_id }));
                }
              }} 
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                background: activeTab === 'bulk' ? 'linear-gradient(135deg, #4f46e5, #3b82f6)' : 'transparent',
                color: activeTab === 'bulk' ? '#ffffff' : '#475569',
                border: 'none', borderRadius: 10, padding: '12px 16px', cursor: 'pointer',
                fontWeight: 600, fontSize: 14, transition: 'all 0.2s', textAlign: 'left'
              }}
            >
              <span style={{ fontSize: 16 }}>📥</span> Bulk Import
            </button>

            <button 
              onClick={() => {
                setActiveTab('enquiries');
                setPkgError(null);
                setPkgSuccess(null);
              }} 
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                background: activeTab === 'enquiries' ? 'linear-gradient(135deg, #4f46e5, #3b82f6)' : 'transparent',
                color: activeTab === 'enquiries' ? '#ffffff' : '#475569',
                border: 'none', borderRadius: 10, padding: '12px 16px', cursor: 'pointer',
                fontWeight: 600, fontSize: 14, transition: 'all 0.2s', textAlign: 'left'
              }}
            >
              <span style={{ fontSize: 16 }}>📧</span> Recent Enquiries
            </button>
          </div>

          {/* Right Column: Main Content Canvas */}
          <div className="glass-card agent-dashboard-main" style={{ padding: '24px', background: '#ffffff', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 16, boxShadow: '0 4px 20px rgba(15,23,42,0.04)' }}>

            {activeTab === 'packages' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    🏷️ Managed Agent Packages
                    {statusFilter !== 'all' && (
                      <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 12, background: statusFilter === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)', color: statusFilter === 'active' ? '#10b981' : '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {statusFilter}
                      </span>
                    )}
                  </h2>
                  {statusFilter !== 'all' && (
                    <button 
                      onClick={() => setStatusFilter('all')} 
                      style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', padding: 0 }}
                    >
                      Clear Filter (Show All)
                    </button>
                  )}
                </div>

                {filteredPackages.length > 0 ? (
                  filteredPackages.map(pkg => (
                    <PackageCard key={pkg.id} pkg={pkg} onEdit={handleStartEdit} />
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 12 }}>🔍</span>
                    <p style={{ margin: 0, fontWeight: 500 }}>
                      {statusFilter === 'all' 
                        ? "You don't have any packages set up yet." 
                        : `No packages with status "${statusFilter}" found.`}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                      {statusFilter === 'all' 
                        ? "Packages assigned to your agent profile will appear here." 
                        : "Try selecting a different status filter or click 'Clear Filter'."}
                    </p>
                    {statusFilter !== 'all' && (
                      <button 
                        onClick={() => setStatusFilter('all')} 
                        className="btn btn-primary" 
                        style={{ marginTop: 16, padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem' }}
                      >
                        Reset Filter
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === 'create' && (
              <form onSubmit={handlePkgSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  {editingPkgId ? '✏️ Edit Agent Package' : '➕ Create New Agent Package'}
                </h2>

                {pkgError && (
                  <div style={{ padding: '12px 16px', borderRadius: 8, background: '#fee2e2', color: '#991b1b', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div>⚠️ {pkgError}</div>
                    {pkgValidationErrors.length > 0 && (
                      <ul style={{ margin: 0, paddingLeft: 20, textAlign: 'left' }}>
                        {pkgValidationErrors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {pkgSuccess && (
                  <div style={{ padding: '12px 16px', borderRadius: 8, background: '#d1fae5', color: '#065f46', fontSize: '0.85rem' }}>
                    ✅ {pkgSuccess}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Package Name *</label>
                    <input name="package_name" value={newPkg.package_name} onChange={handlePkgChange} required style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Destination Name *</label>
                    <input name="destination_name" value={newPkg.destination_name} onChange={handlePkgChange} required placeholder="e.g. Auckland" style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Package Type *</label>
                    <select name="package_type" value={newPkg.package_type} onChange={handlePkgChange} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', outline: 'none' }}>
                      <option value="Adventure">Adventure</option>
                      <option value="Leisure">Leisure</option>
                      <option value="Honeymoon">Honeymoon</option>
                      <option value="Family">Family</option>
                      <option value="Wellness">Wellness</option>
                      <option value="Business">Business</option>
                      <option value="Custom">Custom</option>
                      <option value="Cultural">Cultural</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Travel Mode</label>
                    <select name="travel_mode" value={newPkg.travel_mode} onChange={handlePkgChange} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', outline: 'none' }}>
                      <option value="Flight">Flight</option>
                      <option value="Train">Train</option>
                      <option value="Bus">Bus</option>
                      <option value="Car">Car</option>
                      <option value="Cruise">Cruise</option>
                      <option value="Coach">Coach</option>
                      <option value="Ferry">Ferry</option>
                      <option value="Multi-mode">Multi-mode</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Days *</label>
                    <input type="number" min="0" name="duration_days" value={newPkg.duration_days} onChange={handlePkgChange} required style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Nights *</label>
                    <input type="number" min="0" name="duration_nights" value={newPkg.duration_nights} onChange={handlePkgChange} required style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Base Price *</label>
                    <input type="number" step="0.01" min="0" name="base_price" value={newPkg.base_price} onChange={handlePkgChange} required style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Promo Price</label>
                    <input type="number" step="0.01" min="0" name="promo_price" value={newPkg.promo_price} onChange={handlePkgChange} placeholder="Optional" style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Currency *</label>
                    <input name="currency_code" value={newPkg.currency_code} onChange={handlePkgChange} required style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Min Travelers *</label>
                    <input type="number" min="1" name="min_travelers" value={newPkg.min_travelers} onChange={handlePkgChange} required style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Max Travelers *</label>
                    <input type="number" min="1" name="max_travelers" value={newPkg.max_travelers} onChange={handlePkgChange} required style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Status *</label>
                    <select name="status" value={newPkg.status} onChange={handlePkgChange} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', outline: 'none' }}>
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Service Fee Type</label>
                    <select name="platform_service_fee_type" value={newPkg.platform_service_fee_type} onChange={handlePkgChange} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', outline: 'none' }}>
                      <option value="fixed">Fixed Amount</option>
                      <option value="percentage">Percentage</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Service Fee Value</label>
                    <input type="number" step="0.01" min="0" name="platform_service_fee_value" value={newPkg.platform_service_fee_value} onChange={handlePkgChange} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Provider ID * (Automatically filled)</label>
                    <input name="provider_id" value={newPkg.provider_id} onChange={handlePkgChange} required style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', background: '#f1f5f9', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Provider Type *</label>
                    <input name="provider_type" value={newPkg.provider_type} onChange={handlePkgChange} required style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', background: '#f1f5f9', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" id="is_customizable" name="is_customizable" checked={newPkg.is_customizable} onChange={handlePkgChange} />
                    <label htmlFor="is_customizable" style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 500 }}>Is Customizable</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" id="is_active" name="is_active" checked={newPkg.is_active} onChange={handlePkgChange} />
                    <label htmlFor="is_active" style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 500 }}>Is Active</label>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Summary</label>
                  <input name="summary" value={newPkg.summary} onChange={handlePkgChange} placeholder="Short summary..." style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', outline: 'none' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Description</label>
                  <textarea rows={3} name="description" value={newPkg.description} onChange={handlePkgChange} placeholder="Detailed description..." style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', outline: 'none', resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  {editingPkgId && (
                    <button type="button" onClick={handleCancelEdit} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>
                      Cancel Edit
                    </button>
                  )}
                  <button type="submit" disabled={isSaving} style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>
                    {isSaving ? 'Saving...' : (editingPkgId ? '💾 Save Changes' : 'Create Package')}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'bulk' && (
              <BulkPackageUpload
                token={accessToken}
                mode="agent"
                providerId={profile?.profile_id}
                onImportSuccess={fetchProfileAndPackages}
              />
            )}

            {activeTab === 'enquiries' && (
              <>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>
                  📧 Recent Traveller Enquiries
                </h2>
                
                {enquiriesLoading ? (
                  <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Loading enquiries...</p>
                ) : enquiries.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 12 }}>📭</span>
                    <p style={{ margin: 0, fontWeight: 500 }}>No enquiries yet.</p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>When travellers enquire or suggest offer prices on your packages, they will appear here.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {enquiries.map((enq) => (
                      <div key={enq.id} style={{
                        background: '#ffffff',
                        border: '1px solid rgba(15, 23, 42, 0.08)',
                        borderRadius: 12,
                        padding: '16px 20px',
                        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>
                            {enq.package_name}
                          </span>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <span style={{ fontSize: 10, background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
                              📋 {enq.follow_ups?.length || 0} logs
                            </span>
                            <span style={{ fontSize: 11, background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                              {enq.destination_name}
                            </span>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: 12, borderRadius: 8, flexWrap: 'wrap', gap: 12 }}>
                          <div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>Traveller</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                              {enq.traveller_first_name} {enq.traveller_last_name}
                            </div>
                            <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>
                              {enq.traveller_email}
                            </div>
                            {/* Contact buttons */}
                            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                              <a
                                href={`mailto:${enq.traveller_email}?subject=Regarding your enquiry for ${enq.package_name}`}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                  background: '#e0e7ff', color: '#4338ca', border: 'none',
                                  borderRadius: 4, padding: '3px 8px', fontSize: 11,
                                  fontWeight: 700, textDecoration: 'none', cursor: 'pointer'
                                }}
                              >
                                ✉️ Email
                              </a>
                              {enq.traveller_phone && (
                                <a
                                  href={`tel:${enq.traveller_phone}`}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    background: '#dcfce7', color: '#15803d', border: 'none',
                                    borderRadius: 4, padding: '3px 8px', fontSize: 11,
                                    fontWeight: 700, textDecoration: 'none', cursor: 'pointer'
                                  }}
                                >
                                  📞 Call
                                </a>
                              )}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 11, color: '#64748b' }}>Base Price</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#475569' }}>
                              {enq.currency_code} {Number(enq.base_price).toLocaleString()}
                            </div>
                          </div>
                          {enq.offer_price !== null && enq.offer_price !== undefined && (() => {
                            const base = Number(enq.base_price);
                            const offer = Number(enq.offer_price);
                            const diff = base - offer;
                            const pct = ((diff / base) * 100).toFixed(1);
                            return (
                              <div style={{ textAlign: 'right', background: 'rgba(79,70,229,0.06)', border: '1px solid rgba(79,70,229,0.15)', borderRadius: 6, padding: '4px 10px' }}>
                                <div style={{ fontSize: 11, color: '#4f46e5', fontWeight: 600 }}>Traveller Offer</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: '#4f46e5' }}>
                                  {enq.currency_code} {offer.toLocaleString()}
                                </div>
                                <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 500, marginTop: 2 }}>
                                  -{pct}% off base (-{enq.currency_code} {diff.toLocaleString()})
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Preferred Contact & Question details */}
                        {(enq.preferred_contact_method || enq.enquiry_question) && (
                          <div style={{
                            padding: '12px 16px',
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: 8,
                            fontSize: 13,
                            color: '#166534',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            textAlign: 'left'
                          }}>
                            {enq.preferred_contact_method && (
                              <div>
                                <strong>Preferred contact:</strong>{' '}
                                <span style={{ textTransform: 'capitalize', color: '#14532d' }}>
                                  {enq.preferred_contact_method === 'phone' ? `Phone call (${enq.traveller_phone || 'No phone number provided'})` : 'Email'}
                                </span>
                              </div>
                            )}
                            {enq.enquiry_question && (
                              <div>
                                <strong style={{ display: 'block', marginBottom: 2 }}>Question:</strong>
                                <p style={{ margin: 0, fontStyle: 'italic', whiteSpace: 'pre-wrap', color: '#14532d' }}>
                                  "{enq.enquiry_question}"
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Agent Notes & Follow-ups Timeline */}
                        <div style={{
                          padding: '20px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: 12,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 16,
                          textAlign: 'left'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label htmlFor={`agent-note-${enq.id}`} style={{ fontSize: 13, fontWeight: 800, color: '#334155' }}>
                              📋 Enquiry Follow-up History Log
                            </label>
                            <span style={{ fontSize: 11, background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                              {enq.follow_ups?.length || 0} activities logged
                            </span>
                          </div>

                          {/* Log New Action form */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, padding: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Activity Type:</span>
                              <select
                                value={noteTypeInputs[enq.id] || 'note'}
                                onChange={(e) => setNoteTypeInputs(prev => ({ ...prev, [enq.id]: e.target.value }))}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: 6,
                                  border: '1px solid #cbd5e1',
                                  fontSize: 12,
                                  outline: 'none',
                                  color: '#334155',
                                  background: '#f8fafc',
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="note">📝 General Note</option>
                                <option value="phone">📞 Phone Call</option>
                                <option value="email">✉️ Email Sent</option>
                                <option value="meeting">🤝 Meeting</option>
                              </select>
                            </div>

                            <textarea
                              id={`agent-note-${enq.id}`}
                              rows={2}
                              placeholder="Write details of this follow-up..."
                              value={noteTextInputs[enq.id] || ''}
                              onChange={(e) => setNoteTextInputs(prev => ({ ...prev, [enq.id]: e.target.value }))}
                              style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                padding: '8px 12px',
                                borderRadius: 6,
                                border: '1px solid #cbd5e1',
                                fontSize: 12,
                                outline: 'none',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                                color: '#334155'
                              }}
                            />

                            {notesError[enq.id] && (
                              <span style={{ fontSize: 11, color: '#dc2626' }}>⚠️ {notesError[enq.id]}</span>
                            )}
                            {notesSuccess[enq.id] && (
                              <span style={{ fontSize: 11, color: '#166534' }}>✅ {notesSuccess[enq.id]}</span>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                disabled={savingNotes[enq.id]}
                                onClick={() => handleAddFollowUp(enq.id)}
                                style={{
                                  padding: '6px 14px',
                                  background: 'linear-gradient(135deg, #4f46e5, #3b82f6)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 6,
                                  fontWeight: 700,
                                  fontSize: 11,
                                  cursor: savingNotes[enq.id] ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.2s',
                                  boxShadow: '0 2px 6px rgba(79,70,229,0.15)'
                                }}
                              >
                                {savingNotes[enq.id] ? 'Logging...' : 'Log Follow-up'}
                              </button>
                            </div>
                          </div>

                          {/* Timeline List */}
                          {enq.follow_ups && enq.follow_ups.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: 10, borderLeft: '2px solid #e2e8f0', margin: '4px 0 4px 10px', gap: 16 }}>
                              {enq.follow_ups.map((log) => {
                                let typeIcon = '📝';
                                let typeLabel = 'General Note';
                                let bgStyle = { background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155' };

                                if (log.note_type === 'phone') {
                                  typeIcon = '📞';
                                  typeLabel = 'Phone Call';
                                  bgStyle = { background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#15803d' };
                                } else if (log.note_type === 'email') {
                                  typeIcon = '✉️';
                                  typeLabel = 'Email Sent';
                                  bgStyle = { background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' };
                                } else if (log.note_type === 'meeting') {
                                  typeIcon = '🤝';
                                  typeLabel = 'Meeting';
                                  bgStyle = { background: '#fdf2f8', border: '1px solid #fbcfe8', color: '#be185d' };
                                }

                                return (
                                  <div key={log.id} style={{ position: 'relative', paddingLeft: 16 }}>
                                    {/* Small circle dot on the line */}
                                    <div style={{
                                      position: 'absolute',
                                      left: -17,
                                      top: 4,
                                      width: 10,
                                      height: 10,
                                      borderRadius: '50%',
                                      background: bgStyle.color,
                                      border: '2px solid #ffffff'
                                    }} />

                                    <div style={{
                                      ...bgStyle,
                                      padding: '10px 14px',
                                      borderRadius: 8,
                                      fontSize: 12
                                    }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, fontWeight: 700, fontSize: 11 }}>
                                        <span>{typeIcon} {typeLabel}</span>
                                        <span style={{ fontWeight: 500, opacity: 0.8 }}>
                                          {log.created_at ? new Date(log.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                                        </span>
                                      </div>
                                      <p style={{ margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap', fontWeight: 500 }}>
                                        {log.note_text}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>
                              No interactions logged yet. Use the form above to add notes of your conversations.
                            </p>
                          )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#94a3b8' }}>
                          <span>Interacted: {enq.interaction_count} times</span>
                          <span>
                            {enq.last_interacted_at ? new Date(enq.last_interacted_at).toLocaleString() : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}



          </div>
        </div>
      </div>
    </div>
  );
}
