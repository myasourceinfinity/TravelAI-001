import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPublicPackageDetail } from '../../services/packageService';
import { submitPackageReview } from '../../services/agentService';
import { getProfile } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { saveRecentPackageActivity } from '../../services/recentPackageService';
import Navbar from '../common/Navbar';

const COMPONENT_ICONS = {
  hotel: '🏨',
  flight: '✈️',
  activity: '🎟️',
  transfer: '🚗'
};

export default function PackageDetailPublic() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();

  const [pkg, setPkg] = useState(null);
  const [components, setComponents] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Review states
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState(null);

  // Offer Price state
  const [offerPrice, setOfferPrice] = useState(() => {
    return sessionStorage.getItem('pending_offer_price') || '';
  });
  const [lastTriggeredPrice, setLastTriggeredPrice] = useState('');

  // Modal states
  const [isEnquireModalOpen, setIsEnquireModalOpen] = useState(false);
  const [preferredContact, setPreferredContact] = useState(''); // 'email' or 'phone'
  const [enquiryQuestion, setEnquiryQuestion] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [enquiryError, setEnquiryError] = useState(null);
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);
  const [isPhoneRequiredModalOpen, setIsPhoneRequiredModalOpen] = useState(false);

  useEffect(() => {
    const pendingOffer = sessionStorage.getItem('pending_offer_price');
    if (pendingOffer) {
      sessionStorage.removeItem('pending_offer_price');
      if (user && accessToken && Number(pendingOffer) > 0) {
        setLastTriggeredPrice(pendingOffer);
        setIsEnquireModalOpen(true);
      }
    }
  }, [user, accessToken]);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getPublicPackageDetail(id)
      .then(data => {
        setPkg(data.package);
        setComponents(data.components || []);
        setReviews(data.reviews || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleOfferPriceSubmit = () => {
    if (!offerPrice || Number(offerPrice) <= 0) return;
    if (offerPrice === lastTriggeredPrice) {
      setIsEnquireModalOpen(true);
      return;
    }

    if (!user || !accessToken) {
      sessionStorage.setItem('pending_offer_price', offerPrice);
      sessionStorage.setItem('pending_package_id', pkg.id);
      navigate('/login');
      return;
    }

    setLastTriggeredPrice(offerPrice);
    setIsEnquireModalOpen(true);
  };

  async function handleEnquirePackage() {
    if (!pkg) return;

    if (!user || !accessToken) {
      if (offerPrice) {
        sessionStorage.setItem('pending_offer_price', offerPrice);
        sessionStorage.setItem('pending_package_id', pkg.id);
      }
      navigate('/login');
      return;
    }

    if (offerPrice && Number(offerPrice) > 0) {
      handleOfferPriceSubmit();
      return;
    }

    // Default action (no offer price)
    try {
      await saveRecentPackageActivity(accessToken, {
        packageId: pkg.id,
        activityType: 'enquire',
        offerPrice: null,
      });
    } catch (err) {
      console.warn('[PackageDetailPublic] Failed to save recent package:', err);
    }

    sessionStorage.setItem(
      'pending_trip_description',
      `${pkg.package_name} in ${pkg.destination_name}`
    );

    navigate('/plan-trip');
  }

  async function handleConfirmEnquiry() {
    if (!preferredContact) {
      setEnquiryError('Please select a preferred contact method.');
      return;
    }
    // Question is optional when offerPrice is set
    if (!offerPrice && !enquiryQuestion.trim()) {
      setEnquiryError('Please enter your question.');
      return;
    }
    if (!consentChecked) {
      setEnquiryError('You must accept the Terms of Use and Data Policy to proceed.');
      return;
    }

    setIsSubmittingEnquiry(true);
    setEnquiryError(null);

    try {
      const profileData = await getProfile(accessToken);
      const latestProfile = profileData.user;

      // Phone is only required if preferredContact is 'phone'
      if (preferredContact === 'phone' && (!latestProfile || !latestProfile.phone || !latestProfile.phone.trim())) {
        setIsSubmittingEnquiry(false);
        setIsPhoneRequiredModalOpen(true);
        return;
      }

      const defaultPlaceholder = "Let us know how we can help you - e.g. travel dates, group preferences, accessibility needs, or anything else we should know.";
      const questionText = enquiryQuestion.trim() || defaultPlaceholder;

      await saveRecentPackageActivity(accessToken, {
        packageId: pkg.id,
        activityType: 'enquire',
        offerPrice: offerPrice ? Number(offerPrice) : null,
        preferredContactMethod: preferredContact,
        enquiryQuestion: questionText
      });

      sessionStorage.setItem(
        'pending_trip_description',
        `${pkg.package_name} in ${pkg.destination_name}`
      );

      setIsEnquireModalOpen(false);
      navigate('/plan-trip');
    } catch (err) {
      setEnquiryError(err.message || 'Failed to submit enquiry.');
    } finally {
      setIsSubmittingEnquiry(false);
    }
  }

  async function handleSubmitReview() {
    if (!pkg) return;
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
      const data = await submitPackageReview(pkg.id, accessToken, {
        rating,
        comment,
      });

      setReviews(data.reviews || []);

      if (data.reviewSummary) {
        setPkg(prev => ({
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
      setRating(0);
    } catch (err) {
      setReviewMsg({
        type: 'error',
        text: err.message || 'Failed to submit review.',
      });
    } finally {
      setIsSubmittingReview(false);
    }
  }

  if (isLoading) {
    return (
      <div style={{ background: 'linear-gradient(180deg,#eff4ff 0%,#fbfbf9 100%)', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #4f46e5', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#64748b' }}>Loading package details…</p>
        </div>
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div style={{ background: 'linear-gradient(180deg,#eff4ff 0%,#fbfbf9 100%)', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16, textAlign: 'center', padding: '0 24px' }}>
          <div style={{ fontSize: 48 }}>🔍</div>
          <h2 style={{ margin: 0, color: '#0f172a' }}>Package not found</h2>
          <p style={{ color: '#64748b' }}>{error || 'This package is unavailable or has been removed.'}</p>
          <button
            onClick={() => navigate('/packages')}
            style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#4f46e5,#3b82f6)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
          >
            ← Back to Packages
          </button>
        </div>
      </div>
    );
  }

  const agentInitials = `${pkg.agent_first_name?.[0] || ''}${pkg.agent_last_name?.[0] || ''}`.toUpperCase();
  const durationText = pkg.duration_days && pkg.duration_nights
    ? `${pkg.duration_days} Days / ${pkg.duration_nights} Nights`
    : pkg.duration_days ? `${pkg.duration_days} Days` : 'Flexible Duration';

  // Cost labels
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
    <div style={{ background: 'linear-gradient(180deg,#eff4ff 0%,#fbfbf9 100%)', minHeight: '100vh', paddingBottom: 60 }}>
      <Navbar />

      {/* Main Container */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 5%' }}>

        {/* Back Link */}
        <button
          onClick={() => navigate('/packages')}
          style={{
            background: 'none',
            border: 'none',
            color: '#4f46e5',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            padding: 0,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          ← Back to Packages
        </button>

        {/* Package Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg,#1e3a8a 0%,#3b82f6 50%,#0ea5e9 100%)',
          borderRadius: 20,
          padding: '40px 32px',
          color: 'white',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          marginBottom: 32,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 800, background: 'rgba(255, 255, 255, 0.2)', padding: '4px 10px', borderRadius: 8, backdropFilter: 'blur(4px)' }}>
              📍 {pkg.destination_name}
            </span>
            <span style={{ fontSize: 12, fontWeight: 800, background: 'rgba(255, 255, 255, 0.2)', padding: '4px 10px', borderRadius: 8, backdropFilter: 'blur(4px)', textTransform: 'capitalize' }}>
              🏷️ {pkg.package_type}
            </span>
            <span style={{ fontSize: 12, fontWeight: 800, background: 'rgba(255, 255, 255, 0.2)', padding: '4px 10px', borderRadius: 8, backdropFilter: 'blur(4px)' }}>
              ⏱️ {durationText}
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.02em', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {pkg.package_name}
          </h1>

          <p style={{ fontSize: 16, opacity: 0.95, maxWidth: 700, margin: 0, lineHeight: 1.6 }}>
            {pkg.summary}
          </p>

          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.4) 0%, transparent 60%)' }} />
        </div>

        {/* Two-Column Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>

          {/* Left Column - Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

            {/* Description */}
            <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: '0 0 16px' }}>Overview</h2>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, whiteSpace: 'pre-line', margin: 0 }}>
                {pkg.description || 'No detailed description available for this package.'}
              </p>
            </div>

            {/* Included Components */}
            <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: '0 0 16px' }}>What's Included</h2>
              {components.length === 0 ? (
                <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>No details specified. Enquire with the travel agent for custom configurations.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {components.map((comp) => (
                    <div
                      key={comp.id}
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        gap: 14,
                        alignItems: 'flex-start'
                      }}
                    >
                      <span style={{ fontSize: 24, lineHeight: 1 }}>
                        {COMPONENT_ICONS[comp.componentType?.toLowerCase()] || '📍'}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1e293b' }}>{comp.title}</h4>
                          {comp.isIncluded ? (
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '2px 8px', borderRadius: 6 }}>Included</span>
                          ) : (
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#4f46e5', background: '#e0e7ff', padding: '2px 8px', borderRadius: 6 }}>Add-on ({pkg.currency} {Number(comp.pricePerPerson)})</span>
                          )}
                        </div>
                        {comp.provider && <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Provider: {comp.provider}</div>}
                        {comp.description && <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.5 }}>{comp.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customization Action */}
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 16,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 16
            }}>
              <div style={{ fontSize: 32 }}>✨</div>
              <div>
                <h3 style={{ margin: '0 0 6px', color: '#14532d', fontSize: 16, fontWeight: 800 }}>Want to customize this plan?</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#166534', lineHeight: 1.5 }}>
                  You can modify hotels, flights, and activities to fit your exact budget and travel needs. Customize it with our AI Trip Planner!
                </p>
              </div>
              <button
                onClick={handleEnquirePackage}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: 14,
                  boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
                }}
              >
                Customize & Plan with AI →
              </button>
            </div>

          </div>

          {/* Right Column - Booking Info & Agent Profile */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

            {/* Price Box */}
            <div style={{
              background: 'white',
              borderRadius: 16,
              padding: 24,
              border: '1px solid rgba(15,23,42,0.06)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: 12, fontWeight: 800, background: 'rgba(59,130,246,0.1)', color: costColor, padding: '3px 10px', borderRadius: 20 }}>
                {costLabel} Package
              </span>
              {pkg.promo_price ? (
                <>
                  <div style={{ fontSize: 13, color: '#dc2626', fontWeight: 800, marginTop: 12, marginBottom: 4 }}>🔥 Promo Sale Price</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#dc2626', marginBottom: 4 }}>
                    {pkg.currency} {Number(pkg.promo_price).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', textDecoration: 'line-through', marginBottom: 20 }}>
                    Was {pkg.currency} {Number(pkg.price_per_person).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 12, marginBottom: 4 }}>Price per person</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginBottom: 20 }}>
                    {pkg.currency} {Number(pkg.price_per_person).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </div>
                </>
              )}

              {/* Offer Price Input (Only for travellers or guests) */}
              {(!user || user.role_type === 'traveler') && (
                <div style={{ textAlign: 'left', marginBottom: 20 }}>
                  <label htmlFor="offer-price-input" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                    Suggest Offer Price ({pkg.currency})
                  </label>
                  <input
                    type="number"
                    id="offer-price-input"
                    placeholder="Enter your best offer..."
                    value={offerPrice}
                    onChange={e => setOfferPrice(e.target.value)}
                    onBlur={handleOfferPriceSubmit}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleOfferPriceSubmit();
                      }
                    }}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid #cbd5e1',
                      fontSize: 14,
                      outline: 'none',
                      background: '#f8fafc'
                    }}
                  />
                </div>
              )}

              {(!user || user.role_type === 'traveler') && (
                <button
                  onClick={handleEnquirePackage}
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg,#4f46e5,#3b82f6)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  Enquiry Now
                </button>
              )}
            </div>

            {/* Travel Consultant / Agent Card */}
            {(!user || user.role_type === 'traveler') && (
              <div style={{
                background: 'white',
                borderRadius: 16,
                padding: 24,
                border: '1px solid rgba(15,23,42,0.06)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.03)'
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: '0 0 16px' }}>Your Travel Consultant</h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  {pkg.agent_avatar_url ? (
                    <img src={pkg.agent_avatar_url} alt={pkg.agent_first_name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#818cf8,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'white', fontWeight: 800 }}>
                      {agentInitials}
                    </div>
                  )}
                  <div>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                      {pkg.agent_first_name} {pkg.agent_last_name}
                    </h4>
                    {pkg.agent_nationality && <div style={{ fontSize: 12, color: '#64748b' }}>📍 {pkg.agent_nationality}</div>}
                  </div>
                </div>

                {pkg.agent_bio && (
                  <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: '0 0 16px' }}>
                    {pkg.agent_bio}
                  </p>
                )}

                {/* Stars Rating */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 1 }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} style={{ color: star <= Math.round(Number(pkg.average_rating)) ? '#f59e0b' : '#cbd5e1', fontSize: 15 }}>★</span>
                    ))}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginLeft: 4 }}>{Number(pkg.average_rating) > 0 ? Number(pkg.average_rating).toFixed(1) : 'New'}</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>({pkg.review_count} reviews)</span>
                </div>

                <button
                  onClick={() => navigate(`/agents/${pkg.agent_user_id}`)}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: '#f1f5f9',
                    color: '#4f46e5',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  View Consultant Profile
                </button>
              </div>
            )}

            {/* Google Reviews Style Reviews Section */}
            <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: '0 0 16px' }}>Client Reviews</h3>

              {reviews.length === 0 ? (
                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px' }}>No reviews yet for this package. Be the first to leave feedback!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24, maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
                  {reviews.map(r => (
                    <div key={r.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{r.first_name} {r.last_name}</span>
                        <div style={{ display: 'flex', gap: 1 }}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} style={{ color: star <= r.rating ? '#f59e0b' : '#cbd5e1', fontSize: 12 }}>★</span>
                          ))}
                        </div>
                      </div>
                      {r.comment && <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.4 }}>{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Review Form */}
              {user && user.role_type === 'traveler' && user.id !== pkg.agent_user_id && (
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: '#334155', margin: '0 0 12px' }}>Leave a Review</h4>

                  {/* Interactive Star Selection */}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <span
                        key={star}
                        onClick={() => setRating(star)}
                        style={{
                          color: star <= rating ? '#f59e0b' : '#cbd5e1',
                          fontSize: 22,
                          cursor: 'pointer'
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>

                  <textarea
                    placeholder="Write a comment about your experience with this consultant…"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      height: 80,
                      padding: 10,
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      outline: 'none',
                      resize: 'none',
                      marginBottom: 12
                    }}
                  />

                  {reviewMsg && (
                    <div style={{
                      fontSize: 12,
                      padding: '8px 12px',
                      borderRadius: 6,
                      marginBottom: 12,
                      background: reviewMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
                      color: reviewMsg.type === 'success' ? '#166534' : '#991b1b',
                      border: reviewMsg.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fee2e2'
                    }}>
                      {reviewMsg.text}
                    </div>
                  )}

                  <button
                    disabled={isSubmittingReview}
                    onClick={handleSubmitReview}
                    style={{
                      padding: '8px 16px',
                      background: 'linear-gradient(135deg,#4f46e5,#3b82f6)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: isSubmittingReview ? 'not-allowed' : 'pointer',
                      opacity: isSubmittingReview ? 0.7 : 1
                    }}
                  >
                    Submit Review
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Enquiry Modal */}
      {isEnquireModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: 'white',
            borderRadius: 20,
            width: '100%',
            maxWidth: 500,
            padding: '32px 24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            boxSizing: 'border-box',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setIsEnquireModalOpen(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                fontSize: 24,
                color: '#64748b',
                cursor: 'pointer',
                lineHeight: 1,
                padding: 4
              }}
            >
              &times;
            </button>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 900, color: '#0f172a' }}>
                Negotiate Offer Price
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: '#475569', lineHeight: 1.5 }}>
                Your suggested offer price of <strong style={{ color: '#10b981' }}>{pkg.currency} {offerPrice}</strong> will be sent to the package consultant, <strong>{pkg.agent_first_name} {pkg.agent_last_name}</strong>.
              </p>
            </div>

            {/* Preferred contact method */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
                Preferred contact method <span style={{ color: '#64748b', fontWeight: 500 }}>(Required)</span>
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                {/* Email Pill */}
                <button
                  type="button"
                  onClick={() => setPreferredContact('email')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    borderRadius: 24,
                    border: preferredContact === 'email' ? '1px solid #10b981' : '1px solid #cbd5e1',
                    background: preferredContact === 'email' ? '#f0fdf4' : 'white',
                    color: preferredContact === 'email' ? '#166534' : '#475569',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    border: preferredContact === 'email' ? '4px solid #10b981' : '1.5px solid #cbd5e1',
                    background: preferredContact === 'email' ? 'white' : 'transparent',
                    boxSizing: 'border-box'
                  }} />
                  Email
                </button>

                {/* Phone Call Pill */}
                <button
                  type="button"
                  onClick={() => setPreferredContact('phone')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    borderRadius: 24,
                    border: preferredContact === 'phone' ? '1px solid #10b981' : '1px solid #cbd5e1',
                    background: preferredContact === 'phone' ? '#f0fdf4' : 'white',
                    color: preferredContact === 'phone' ? '#166534' : '#475569',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    border: preferredContact === 'phone' ? '4px solid #10b981' : '1.5px solid #cbd5e1',
                    background: preferredContact === 'phone' ? 'white' : 'transparent',
                    boxSizing: 'border-box'
                  }} />
                  Phone call
                </button>
              </div>
            </div>

            {/* Question Box */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="enquiry-question" style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
                Your question <span style={{ color: '#64748b', fontWeight: 500 }}>{offerPrice ? '(Optional)' : '(Required)'}</span>
              </label>
              <textarea
                id="enquiry-question"
                placeholder="Let us know how we can help you - e.g. travel dates, group preferences, accessibility needs, or anything else we should know."
                value={enquiryQuestion}
                onChange={e => setEnquiryQuestion(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  height: 100,
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  fontSize: 14,
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit',
                  color: '#0f172a',
                  lineHeight: 1.5
                }}
              />
            </div>

            {/* Consent Checkbox */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <input
                type="checkbox"
                id="consent-checkbox"
                checked={consentChecked}
                onChange={e => setConsentChecked(e.target.checked)}
                style={{
                  marginTop: 3,
                  width: 16,
                  height: 16,
                  cursor: 'pointer'
                }}
              />
              <label htmlFor="consent-checkbox" style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, cursor: 'pointer', userSelect: 'none' }}>
                By proceeding you accept our <a href="#" style={{ color: '#10b981', textDecoration: 'none', fontWeight: 600 }}>Terms of Use</a> and <a href="#" style={{ color: '#10b981', textDecoration: 'none', fontWeight: 600 }}>Data Policy</a>.
              </label>
            </div>

            {/* Error Message */}
            {enquiryError && (
              <div style={{
                fontSize: 13,
                padding: '10px 14px',
                borderRadius: 8,
                background: '#fef2f2',
                color: '#991b1b',
                border: '1px solid #fee2e2'
              }}>
                ⚠️ {enquiryError}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
              <button
                type="button"
                disabled={isSubmittingEnquiry}
                onClick={handleConfirmEnquiry}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 700,
                  cursor: isSubmittingEnquiry ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  opacity: isSubmittingEnquiry ? 0.7 : 1,
                  transition: 'background 0.2s',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
                }}
              >
                {isSubmittingEnquiry ? 'Submitting...' : 'Submit enquiry'}
              </button>

              <button
                type="button"
                onClick={() => setIsEnquireModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontWeight: 600,
                  textAlign: 'center',
                  width: '100%',
                  padding: '4px 0'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Phone Required Modal */}
      {isPhoneRequiredModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: 20
        }}>
          <div style={{
            background: 'white',
            borderRadius: 20,
            width: '100%',
            maxWidth: 420,
            padding: '32px 24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            boxSizing: 'border-box',
            textAlign: 'center',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setIsPhoneRequiredModalOpen(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                fontSize: 24,
                color: '#64748b',
                cursor: 'pointer',
                lineHeight: 1,
                padding: 4
              }}
            >
              &times;
            </button>

            {/* Icon */}
            <div style={{ fontSize: 40, margin: '0 auto 8px' }}>📞</div>

            {/* Header */}
            <div>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 900, color: '#0f172a' }}>
                Phone Number Required
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: '#475569', lineHeight: 1.5 }}>
                You must have a phone number in your profile to send an enquiry. Please update your phone number in Profile settings.
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => {
                  setIsPhoneRequiredModalOpen(false);
                  navigate('/profile');
                }}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: 14,
                  boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
                }}
              >
                Update Profile Settings
              </button>

              <button
                type="button"
                onClick={() => setIsPhoneRequiredModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontWeight: 600,
                  textAlign: 'center',
                  width: '100%',
                  padding: '4px 0'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
