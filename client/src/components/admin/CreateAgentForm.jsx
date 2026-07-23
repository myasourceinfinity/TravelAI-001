import { useState } from 'react';
import { createAdminAgent } from '../../services/adminService';

const SPECIALTIES = ['Luxury','Adventure','Cultural','Honeymoon','Family','Wellness','Business','Budget'];

const field = (label, name, value, onChange, opts = {}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{label}{opts.required ? ' *' : ''}</label>
    {opts.type === 'textarea' ? (
      <textarea
        name={name} value={value} onChange={onChange} rows={3} placeholder={opts.placeholder || ''}
        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', outline: 'none', resize: 'vertical', fontSize: 14 }}
      />
    ) : (
      <input
        type={opts.type || 'text'} name={name} value={value} onChange={onChange}
        required={opts.required} placeholder={opts.placeholder || ''}
        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.15)', outline: 'none', fontSize: 14 }}
      />
    )}
  </div>
);

export default function CreateAgentForm({ token, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    password: '', nationality: '', bio: '',
  });
  const [specialties, setSpecialties] = useState([]);
  const [isSaving, setIsSaving]       = useState(false);
  const [error, setError]             = useState(null);
  const [created, setCreated]         = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError(null);
  }

  function toggleSpecialty(s) {
    setSpecialties(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const res = await createAdminAgent(token, { ...form, specialties });
      setCreated(res);
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (created) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ padding: 16, background: '#d1fae5', borderRadius: 10, color: '#065f46' }}>
          <strong>✅ Agent created!</strong>
          <p style={{ margin: '8px 0 0', fontSize: 13 }}>
            Share these credentials with the agent — the password is shown <strong>once only</strong>.
          </p>
        </div>
        <div style={{ background: '#f8fafc', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 10, padding: 16, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div><strong>Name:</strong> {created.agent.first_name} {created.agent.last_name}</div>
          <div><strong>Email:</strong> {created.agent.email}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <strong>Temp Password:</strong>
            <code style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: 4 }}>{created.tempPassword}</code>
            <button
              onClick={() => navigator.clipboard.writeText(created.tempPassword)}
              style={{ fontSize: 11, padding: '2px 8px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
            >Copy</button>
          </div>
        </div>
        <button
          onClick={onCancel}
          style={{ padding: '10px', background: 'linear-gradient(135deg,#4f46e5,#3b82f6)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>➕ Create New Agent</h3>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {field('First Name', 'first_name', form.first_name, handleChange, { required: true })}
        {field('Last Name', 'last_name', form.last_name, handleChange)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {field('Email', 'email', form.email, handleChange, { required: true, type: 'email' })}
        {field('Phone', 'phone', form.phone, handleChange, { placeholder: '+64 ...' })}
      </div>
      {field('Temp Password', 'password', form.password, handleChange, { required: true, type: 'password', placeholder: 'Min 8 characters' })}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {field('Nationality', 'nationality', form.nationality, handleChange)}
        {field('Bio / Pitch', 'bio', form.bio, handleChange, { type: 'textarea' })}
      </div>

      {/* Specialties */}
      <div>
        <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 8 }}>Specialties</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SPECIALTIES.map(s => (
            <button
              key={s} type="button"
              onClick={() => toggleSpecialty(s)}
              style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: specialties.includes(s) ? 'none' : '1px solid rgba(15,23,42,0.15)',
                background: specialties.includes(s) ? 'linear-gradient(135deg,#4f46e5,#3b82f6)' : 'transparent',
                color: specialties.includes(s) ? 'white' : '#475569',
              }}
            >{s}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button
          type="button" onClick={onCancel}
          style={{ flex: 1, padding: '10px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
        >Cancel</button>
        <button
          type="submit" disabled={isSaving}
          style={{ flex: 2, padding: '10px', background: 'linear-gradient(135deg,#4f46e5,#3b82f6)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
        >{isSaving ? 'Creating...' : 'Create Agent'}</button>
      </div>
    </form>
  );
}
