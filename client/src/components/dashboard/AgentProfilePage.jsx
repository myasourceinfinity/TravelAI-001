import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getProfile, updateProfile } from '../../services/authService';
import Navbar from '../common/Navbar';

export default function AgentProfilePage() {
  const navigate = useNavigate();
  const { accessToken, logout } = useAuth();

  const [profile, setProfile]     = useState(null);
  const [form, setForm]           = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving]   = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveMsg, setSaveMsg]     = useState(null);
  const [error, setError]         = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProfile(accessToken);
      setProfile(data.user);
      setForm(buildFormState(data.user));
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

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  function buildFormState(p) {
    return {
      first_name:  p.first_name || '',
      last_name:   p.last_name  || '',
      phone:       p.phone      || '',
      dob:         p.dob ? p.dob.slice(0, 10) : '',
      nationality: p.nationality || '',
      bio:         p.bio        || '',
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

  if (isLoading) {
    return (
      <div className="dashboard-page page-bg" style={{ background: 'linear-gradient(180deg, #eff4ff 0%, #fbfbf9 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="dashboard-loader" style={{ textAlign: 'center' }}>
          <span className="spinner" style={{ width: 32, height: 32, display: 'inline-block' }} />
          <p style={{ color: '#64748b', marginTop: 16 }}>Loading Profile…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page page-bg" style={{ background: 'linear-gradient(180deg, #eff4ff 0%, #fbfbf9 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-card" style={{ padding: '24px', borderRadius: 16, background: '#ffffff', border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <p style={{ color: '#ef4444' }}>⚠️ {error}</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={fetchProfile}>Retry</button>
        </div>
      </div>
    );
  }

  const initials = `${(profile?.first_name?.[0] || '').toUpperCase()}${(profile?.last_name?.[0] || '').toUpperCase()}`;

  return (
    <div className="dashboard-page page-bg" style={{ display: 'block', background: 'linear-gradient(180deg, #eff4ff 0%, #fbfbf9 100%)', minHeight: '100vh', padding: 0 }}>
      <Navbar />
      <div className="dashboard-container" style={{ maxWidth: 960, margin: '0 auto', width: '100%', padding: '2rem 5%' }}>
        
        {/* Profile Header */}
        <header className="dashboard-header glass-card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', background: '#ffffff', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 16, boxShadow: '0 4px 20px rgba(15,23,42,0.05)', marginBottom: '1.5rem' }}>
          <div className="avatar-circle" style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#818cf8,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'white', fontWeight: 'bold' }}>👤</div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              My Profile: <span style={{ background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{profile?.first_name}</span>
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0' }}>
              {profile?.email} · <span style={{ background: 'linear-gradient(135deg,#6366f1,#3b82f6)', color: 'white', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 'bold', textTransform: 'uppercase' }}>{profile?.role_type}</span>
            </p>
          </div>
        </header>

        {saveMsg && (
          <div style={{ padding: '12px 16px', borderRadius: 8, background: saveMsg.type === 'success' ? '#d1fae5' : '#fee2e2', color: saveMsg.type === 'success' ? '#065f46' : '#991b1b', marginBottom: 16 }}>
            {saveMsg.type === 'success' ? '✅' : '⚠️'} {saveMsg.text}
          </div>
        )}

        {/* Profile Form Workspace */}
        <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 16, boxShadow: '0 4px 20px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid rgba(15, 23, 42, 0.06)', paddingBottom: 12 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                👤 Personal Profile Information
              </h2>
              {!isEditing ? (
                <button className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem' }} onClick={() => setIsEditing(true)}>
                  ✏️ Edit Profile
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost" style={{ padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem' }} onClick={handleCancel} disabled={isSaving}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem' }} onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving…' : '💾 Save Changes'}
                  </button>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>First Name</label>
                  <input
                    name="first_name"
                    value={form.first_name || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', background: isEditing ? 'white' : '#f8fafc', color: '#0f172a', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Last Name</label>
                  <input
                    name="last_name"
                    value={form.last_name || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', background: isEditing ? 'white' : '#f8fafc', color: '#0f172a', outline: 'none' }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Phone Number</label>
                  <input
                    name="phone"
                    value={form.phone || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', background: isEditing ? 'white' : '#f8fafc', color: '#0f172a', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Nationality</label>
                  <input
                    name="nationality"
                    value={form.nationality || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', background: isEditing ? 'white' : '#f8fafc', color: '#0f172a', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Bio / Pitch</label>
                <textarea
                  name="bio"
                  rows={4}
                  value={form.bio || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', background: isEditing ? 'white' : '#f8fafc', color: '#0f172a', outline: 'none', resize: 'vertical' }}
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
