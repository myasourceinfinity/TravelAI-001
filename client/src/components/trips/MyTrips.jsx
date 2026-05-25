import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getSavedTrips } from '../../services/tripService';

export default function MyTrips() {
  const navigate = useNavigate();
  const { accessToken, logout } = useAuth();
  
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTripId, setExpandedTripId] = useState(null);

  useEffect(() => {
    async function fetchTrips() {
      if (!accessToken) return;
      try {
        const data = await getSavedTrips(accessToken);
        setTrips(data.trips || []);
      } catch (err) {
        if (err.status === 401) {
          await logout();
          navigate('/');
        } else {
          setError(err.message || 'Failed to load trips');
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchTrips();
  }, [accessToken, logout, navigate]);

  const toggleExpand = (id) => {
    setExpandedTripId(prev => (prev === id ? null : id));
  };

  if (isLoading) {
    return (
      <div className="dashboard-page page-bg">
        <div className="dashboard-loader text-center mt-12">
          <span className="spinner" style={{ width: 32, height: 32 }} />
          <p className="text-secondary mt-4">Loading your trips…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page page-bg">
      <div className="dashboard-container">
        
        <header className="dashboard-header glass-card" style={{ marginBottom: '2rem' }}>
          <div className="dashboard-header-left">
            <div className="avatar-circle">🗺️</div>
            <div>
              <h1 className="heading-lg">My Saved Trips</h1>
              <p className="text-sm text-secondary">
                View and manage your AI-generated travel itineraries.
              </p>
            </div>
          </div>
          <div className="dashboard-header-right">
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>
              ← Back to Dashboard
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/plan-trip')}>
              ✦ Plan a New Trip
            </button>
          </div>
        </header>

        {error && (
          <div className="alert alert-error mb-4">⚠️ {error}</div>
        )}

        {trips.length === 0 && !error ? (
          <div className="glass-card text-center" style={{ padding: '4rem 2rem' }}>
            <h2 className="heading-md mb-2">No trips saved yet!</h2>
            <p className="text-secondary mb-6">You haven't planned any trips with TravelAI. Let's fix that!</p>
            <button className="btn btn-primary" onClick={() => navigate('/plan-trip')}>
              ✦ Plan your first trip
            </button>
          </div>
        ) : (
          <div className="trip-table-container">
            <table className="trip-table">
              <thead>
                <tr>
                  <th>Trip Name</th>
                  <th>Start City</th>
                  <th>Duration</th>
                  <th>Travelers</th>
                  <th>Budget</th>
                  <th>Saved On</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trips.map(trip => {
                  const isExpanded = expandedTripId === trip.id;
                  return (
                    <Fragment key={trip.id}>
                      <tr className={isExpanded ? 'expanded-row' : ''}>
                        <td style={{ fontWeight: 500 }}>{trip.title || `${trip.start_city} Trip`}</td>
                        <td>{trip.start_city}</td>
                        <td>{trip.days} Days</td>
                        <td>{trip.travelers} pax</td>
                        <td style={{ textTransform: 'capitalize' }}>{trip.budget_level}</td>
                        <td className="text-muted">{new Date(trip.created_at).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            onClick={() => toggleExpand(trip.id)}
                            style={{ padding: '6px 12px' }}
                          >
                            {isExpanded ? '▲ Hide Details' : '▼ View Details'}
                          </button>
                        </td>
                      </tr>
                      
                      {isExpanded && (
                        <tr className="expanded-content-row">
                          <td colSpan="7">
                            <div className="trip-sub-table-container phase-enter">
                              
                              <p className="text-sm text-secondary mb-4" style={{ maxWidth: '800px', lineHeight: 1.6 }}>
                                <strong>Summary:</strong> {trip.summary || 'No summary available.'}
                              </p>

                              {trip.destinations && trip.destinations.length > 0 ? (
                                <table className="trip-table" style={{ background: 'var(--bg-900)', borderRadius: '8px', overflow: 'hidden' }}>
                                  <thead>
                                    <tr>
                                      <th>Destination</th>
                                      <th>Country</th>
                                      <th>Highlights</th>
                                      <th>Activities (Bookme Deals)</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {trip.destinations.map(dest => (
                                      <tr key={dest.id}>
                                        <td>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                                            <span style={{ fontSize: '1.2rem' }}>{dest.emoji}</span>
                                            <span style={{ fontWeight: 500 }}>{dest.name}</span>
                                          </div>
                                        </td>
                                        <td className="text-muted text-sm" style={{ whiteSpace: 'nowrap' }}>{dest.country}</td>
                                        <td className="text-sm text-secondary">
                                          {dest.highlights && dest.highlights.length > 0 ? dest.highlights.join(' • ') : '—'}
                                        </td>
                                        <td>
                                          {dest.bookmeDeals && dest.bookmeDeals.length > 0 ? (
                                            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', maxWidth: '300px' }}>
                                              {dest.bookmeDeals.map((deal, i) => (
                                                <a 
                                                  key={i} 
                                                  href={deal.link} 
                                                  target="_blank" 
                                                  rel="noreferrer"
                                                  title={deal.title}
                                                  style={{ 
                                                    minWidth: '120px',
                                                    background: 'var(--bg-800)', 
                                                    borderRadius: '4px', 
                                                    padding: '6px',
                                                    textDecoration: 'none',
                                                    border: '1px solid var(--glass-border)'
                                                  }}
                                                >
                                                  <div className="text-xs font-medium" style={{ color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>
                                                    {deal.title}
                                                  </div>
                                                  <div className="text-xs" style={{ color: 'var(--brand-400)', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>{deal.price}</span>
                                                    {deal.discount && <span style={{color: 'var(--brand-500)', fontSize: '0.65rem'}}>{deal.discount}</span>}
                                                  </div>
                                                </a>
                                              ))}
                                            </div>
                                          ) : (
                                            <span className="text-xs text-muted">No activities found</span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <p className="text-sm text-muted">No destinations available for this trip.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
