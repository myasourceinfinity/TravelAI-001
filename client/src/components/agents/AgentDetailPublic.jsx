import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPublicAgentDetail, submitAgentReview } from '../../services/agentService';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../common/Navbar';
import { saveRecentPackageActivity } from '../../services/recentPackageService';

const SPECIALTY_COLORS = {
  Luxury:     { bg: 'rgba(168,85,247,0.12)',  color: '#7c3aed', border: 'rgba(168,85,247,0.25)' },
  Adventure:  { bg: 'rgba(239,68,68,0.12)',   color: '#b91c1c', border: 'rgba(239,68,68,0.25)' },
  Cultural:   { bg: 'rgba(14,165,233,0.12)',  color: '#0369a1', border: 'rgba(14,165,233,0.25)' },
  Honeymoon:  { bg: 'rgba(236,72,153,0.12)',  color: '#be185d', border: 'rgba(236,72,153,0.25)' },
  Family:     { bg: 'rgba(251,191,36,0.12)',  color: '#b45309', border: 'rgba(251,191,36,0.25)' },
  Wellness:   { bg: 'rgba(52,211,153,0.12)',  color: '#065f46', border: 'rgba(52,211,153,0.25)' },
  Business:   { bg: 'rgba(100,116,139,0.12)', color: '#475569', border: 'rgba(100,116,139,0.25)' },
  Budget:     { bg: 'rgba(16,185,129,0.12)',  color: '#047857', border: 'rgba(16,185,129,0.25)' },
};

const PKG_TYPE_ICONS = {
  Leisure: '🌴', Adventure: '⛰️', Honeymoon: '💑', Family: '👨‍👩‍👧',
  Wellness: '🧘', Business: '💼', Cultural: '🏛️', Custom: '✨',
};

export default function AgentDetailPublic() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user, accessToken } = useAuth();

  const [agent,     setAgent]     = useState(null);
  const [packages,  setPackages]  = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getPublicAgentDetail(id)
      .then(data => {
        setAgent(data.agent);
        setPackages(data.packages || []);
        setReviews(data.reviews || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [id]);

    async function handleSubmitReview() {
    if (!user || !accessToken) {
      navigate('/login');
      return;
    }

    if (!rating) {
      setReviewMsg({ type: 'error', text: 'Please select a rating first.' });
      return;
    }

    setIsSubmittingReview(true);
    setReviewMsg(null);

    try {
      const data = await submitAgentReview(id, accessToken, {
        rating,
        comment,
      });

      setReviews(data.reviews || []);

      if (data.reviewSummary) {
        setAgent(prev => ({
          ...prev,
          average_rating: data.reviewSummary.average_rating,
          review_count: data.reviewSummary.review_count,
        }));
      }

      setReviewMsg({
        type: 'success',
        text: 'Thank you! Your review has been submitted.',
      });

      setComment('');
    } catch (err) {
      setReviewMsg({
        type: 'error',
        text: err.message || 'Failed to submit review.',
      });
    } finally {
      setIsSubmittingReview(false);
    }
  }

  async function handleEnquirePackage(pkg) {
    if (accessToken && user) {
      try {
        await saveRecentPackageActivity(accessToken, {
          packageId: pkg.id,
          activityType: 'enquire',
        });
      } catch (err) {
        console.warn('[AgentDetailPublic] Failed to save recent package:', err);
      }
    }

    sessionStorage.setItem(
      'pending_trip_description',
      `${pkg.package_name} in ${pkg.destination_name}`
    );

    navigate('/plan-trip');
  }

  if (isLoading) {
    return (
      <div style={{ background: 'linear-gradient(180deg,#eff4ff 0%,#fbfbf9 100%)', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #4f46e5', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#64748b' }}>Loading agent profile…</p>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div style={{ background: 'linear-gradient(180deg,#eff4ff 0%,#fbfbf9 100%)', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16, textAlign: 'center', padding: '0 24px' }}>
          <div style={{ fontSize: 48 }}>🔍</div>
          <h2 style={{ margin: 0, color: '#0f172a' }}>Agent not found</h2>
          <p style={{ color: '#64748b' }}>{error || 'This agent profile is unavailable or inactive.'}</p>
          <button
            onClick={() => navigate('/agents')}
            style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#4f46e5,#3b82f6)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
          >
            ← Back to Agents
          </button>
        </div>
      </div>
    );
  }

  const initials    = `${agent.first_name?.[0] || ''}${agent.last_name?.[0] || ''}`.toUpperCase();
  const specialties = Array.isArray(agent.specialties) ? agent.specialties : [];

  return (
    <div style={{ background: 'linear-gradient(180deg,#eff4ff 0%,#fbfbf9 100%)', minHeight: '100vh' }}>
      <Navbar />

      {/* ── Hero banner ── */}
      <div style={{ background: 'linear-gradient(135deg,#3730a3 0%,#1d4ed8 60%,#0ea5e9 100%)', padding: '40px 5% 32px', color: 'white' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <button
            onClick={() => navigate('/agents')}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer', marginBottom: 24, fontWeight: 600 }}
          >
            ← All Agents
          </button>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
            {/* Avatar */}
            {agent.avatar_url ? (
              <img src={agent.avatar_url} alt={initials}
                style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.4)', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, color: 'white', flexShrink: 0 }}>
                {initials || '?'}
              </div>
            )}

            <div style={{ flex: 1 }}>
              <h1 style={{ margin: '0 0 4px', fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 900, letterSpacing: '-0.01em' }}>
                {agent.first_name} {agent.last_name}
              </h1>
              <p style={{ margin: '0 0 14px', opacity: 0.8, fontSize: 14 }}>
                Travel Consultant{agent.nationality ? ` · ${agent.nationality}` : ''}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#facc15' }}>
                    ⭐ {Number(agent.average_rating) > 0 ? Number(agent.average_rating).toFixed(1) : 'New'}
                  </span>
                  <span style={{ fontSize: 13, opacity: 0.82 }}>
                    {Number(agent.review_count) > 0
                      ? `${agent.review_count} review${Number(agent.review_count) !== 1 ? 's' : ''}`
                      : 'No reviews yet'}
                  </span>
                </div>

              {/* Specialty badges */}
              {specialties.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {specialties.map(s => (
                    <span key={s} style={{ fontSize: 12, padding: '3px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', fontWeight: 600 }}>
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 24, flexShrink: 0, flexWrap: 'wrap' }}>
              {[
                { label: 'Active Packages', value: agent.active_packages || 0 },
                { label: 'Total Packages',  value: agent.total_packages  || 0 },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{s.value}</div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 5%', display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Left: Bio + Specialties */}
        <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* About */}
          {agent.bio && (
            <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>About</h3>
              <p style={{ margin: 0, fontSize: 14, color: '#475569', lineHeight: 1.7 }}>{agent.bio}</p>
            </div>
          )}

          {/* Specialties detail */}
          {specialties.length > 0 && (
            <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Specialties</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {specialties.map(s => {
                  const sc = SPECIALTY_COLORS[s] || { bg: '#f1f5f9', color: '#475569', border: 'rgba(15,23,42,0.1)' };
                  return (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: sc.bg, border: `1px solid ${sc.border}` }}>
                      <span style={{ fontSize: 18 }}>{PKG_TYPE_ICONS[s] || '✨'}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: sc.color }}>{s}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Traveller Reviews
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>
                {Number(agent.average_rating) > 0 ? Number(agent.average_rating).toFixed(1) : 'New'}
              </div>
              <div>
                <div style={{ color: '#f59e0b', fontSize: 16 }}>
                  {'★'.repeat(Math.round(Number(agent.average_rating) || 0))}
                  {'☆'.repeat(5 - Math.round(Number(agent.average_rating) || 0))}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {Number(agent.review_count) || 0} review{Number(agent.review_count) !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(15,23,42,0.08)', paddingTop: 16, marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                Leave a Review
              </div>

              <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: 26,
                      color: star <= rating ? '#f59e0b' : '#cbd5e1',
                      padding: 0,
                      lineHeight: 1,
                    }}
                    aria-label={`${star} star`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this travel agent..."
                rows={3}
                maxLength={1000}
                style={{
                  width: '100%',
                  resize: 'vertical',
                  border: '1px solid rgba(15,23,42,0.14)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: 10,
                }}
              />

              {reviewMsg && (
                <div
                  style={{
                    fontSize: 12,
                    marginBottom: 10,
                    color: reviewMsg.type === 'success' ? '#047857' : '#b91c1c',
                    background: reviewMsg.type === 'success' ? '#d1fae5' : '#fee2e2',
                    padding: '8px 10px',
                    borderRadius: 8,
                  }}
                >
                  {reviewMsg.type === 'success' ? '✅' : '⚠️'} {reviewMsg.text}
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={isSubmittingReview}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: 'linear-gradient(135deg,#4f46e5,#3b82f6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: isSubmittingReview ? 'default' : 'pointer',
                  opacity: isSubmittingReview ? 0.7 : 1,
                }}
              >
                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>

            {reviews.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                No reviews yet. Be the first to review this agent.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {reviews.map(review => {
                  const reviewerName = `${review.first_name || ''} ${review.last_name || ''}`.trim() || 'Traveller';

                  return (
                    <div key={review.id} style={{ borderTop: '1px solid rgba(15,23,42,0.08)', paddingTop: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
                        <strong style={{ fontSize: 13, color: '#0f172a' }}>{reviewerName}</strong>
                        <span style={{ color: '#f59e0b', fontSize: 13 }}>
                          {'★'.repeat(Number(review.rating))}
                          {'☆'.repeat(5 - Number(review.rating))}
                        </span>
                      </div>

                      {review.comment && (
                        <p style={{ margin: '4px 0 6px', fontSize: 13, color: '#475569', lineHeight: 1.55 }}>
                          {review.comment}
                        </p>
                      )}

                      <small style={{ color: '#94a3b8', fontSize: 11 }}>
                        {review.updated_at
                          ? new Date(review.updated_at).toLocaleDateString('en-US', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : ''}
                      </small>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Contact CTA */}
          <div style={{ background: 'linear-gradient(135deg,#4f46e5,#3b82f6)', borderRadius: 16, padding: 20, textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✉️</div>
            <h3 style={{ margin: '0 0 6px', fontWeight: 800, fontSize: 16 }}>Ready to plan your trip?</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, opacity: 0.85 }}>Chat with {agent.first_name} to get a personalised itinerary.</p>
            <button
              onClick={() => {
                sessionStorage.setItem(
                  'pending_trip_description',
                  `Plan a personalised trip with ${agent.first_name} ${agent.last_name}`
                );

                navigate('/plan-trip');
              }}
              style={{ background: 'white', color: '#4f46e5', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', width: '100%' }}
            >
              Start Planning →
            </button>
          </div>
        </div>

        {/* Right: Packages */}
        <div style={{ flex: '2 1 340px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
            📦 Available Packages
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 400, marginLeft: 8 }}>({packages.length})</span>
          </h2>

          {packages.length === 0 ? (
            <div style={{ background: 'white', borderRadius: 16, padding: '40px 24px', textAlign: 'center', border: '1px solid rgba(15,23,42,0.08)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
              <p style={{ color: '#64748b', margin: 0 }}>No active packages yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {packages.map(pkg => (
                <div key={pkg.id} style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  {/* Package header */}
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 18 }}>{PKG_TYPE_ICONS[pkg.package_type] || '✈️'}</span>
                          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{pkg.package_name}</h3>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(59,130,246,0.08)', color: '#0369a1', border: '1px solid rgba(59,130,246,0.15)' }}>
                            📍 {pkg.destination_name}
                          </span>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(52,211,153,0.08)', color: '#065f46', border: '1px solid rgba(52,211,153,0.15)' }}>
                            {pkg.duration_days}d / {pkg.duration_nights}n
                          </span>
                          {pkg.travel_mode && (
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#f1f5f9', color: '#475569' }}>
                              {pkg.travel_mode}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 11, color: '#64748b' }}>From</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#4f46e5' }}>
                          {pkg.currency} {Number(pkg.price_per_person).toLocaleString()}
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>per person</div>
                      </div>
                    </div>
                  </div>

                  {/* Package summary */}
                  {pkg.summary && (
                    <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(15,23,42,0.05)' }}>
                      <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{pkg.summary}</p>
                    </div>
                  )}

                  {/* Traveller info */}
                  <div style={{ padding: '10px 20px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      👥 {pkg.min_travelers}–{pkg.max_travelers} travellers
                    </span>
                    {pkg.is_customizable && (
                      <span style={{ fontSize: 12, color: '#4f46e5', fontWeight: 600 }}>✏️ Customisable</span>
                    )}
                    <div style={{ marginLeft: 'auto' }}>
                      <button
                        onClick={() => handleEnquirePackage(pkg)}
                        style={{ fontSize: 12, padding: '6px 14px', background: 'linear-gradient(135deg,#4f46e5,#3b82f6)', color: 'white', border: 'none', borderRadius: 7, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Enquire →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
