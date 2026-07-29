/**
 * bookingService.js
 * Node.js equivalent of booking_tools.py
 * Wraps Booking.com RapidAPI for flight and hotel search.
 *
 * Place at: server/services/bookingService.js
 */

const axios = require('axios');

const RAPIDAPI_KEY  = process.env.RAPIDAPI_KEY || '6d8268f80cmshb2c04b8e3263ba5p1adacfjsn18cd6d67ab3e';
const RAPIDAPI_HOST = 'booking-com.p.rapidapi.com';
const BASE_URL      = `https://${RAPIDAPI_HOST}/v1`;

const HEADERS = {
  'x-rapidapi-host': RAPIDAPI_HOST,
  'x-rapidapi-key':  RAPIDAPI_KEY,
};

async function _get(path, params, timeoutMs = 12000) {
  try {
    const res = await axios.get(`${BASE_URL}${path}`, {
      headers: HEADERS,
      params,
      timeout: timeoutMs,
    });
    return res.data;
  } catch (err) {
    // Surface the ACTUAL RapidAPI error body (e.g. "Invalid from_id format")
    // instead of a generic "Request failed with status code 422" — this is
    // essential for debugging which param was rejected.
    const detail = err.response?.data
      ? (typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data))
      : err.message;
    const enrichedErr = new Error(`${path} → ${err.response?.status || 'ERR'}: ${detail}`);
    enrichedErr.status = err.response?.status;
    enrichedErr.params = params;
    throw enrichedErr;
  }
}

// ── Date guard: push past dates forward to next future occurrence ─────────────
function fixPastDate(dateStr) {
  if (!dateStr) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d >= today) return dateStr;
  // Roll forward by 1 year
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
}

// ── Flight location search ────────────────────────────────────────────────────
async function searchFlightLocation(query) {
  const data = await _get('/flights/locations', { name: query, locale: 'en-gb' });
  const results = Array.isArray(data) ? data : (data.data || []);
  const airports = results.filter(r => r.type === 'AIRPORT');
  return airports.length ? airports : results;
}

// ── Flight search ─────────────────────────────────────────────────────────────
async function searchFlights({
  from_id,
  to_id,
  depart_date,
  return_date   = null,
  adults        = 1,
  cabin_class   = 'ECONOMY',
  currency_code = 'NZD',
}) {
  depart_date = fixPastDate(depart_date);
  if (return_date) return_date = fixPastDate(return_date);

  const params = {
    from_code:    from_id,
    to_code:      to_id,
    depart_date,
    adults,
    order_by:     'BEST',
    flight_type:  return_date ? 'ROUNDTRIP' : 'ONEWAY',
    locale:       'en-gb',
    currency:     currency_code,
    cabin_class,
    page_number:  0,
  };
  if (return_date) params.return_date = return_date;

  // Round-trip flight search is noticeably heavier on Booking.com's backend
  // than one-way, hotel, or location lookups — give it more room before failing.
  return _get('/flights/search', params, 20000);
}

// ── Hotel destination search ──────────────────────────────────────────────────
async function searchHotelDestination(query) {
  const data = await _get('/hotels/locations', { name: query, locale: 'en-gb' });
  const results = Array.isArray(data) ? data : (data.data || []);
  // Normalise: add search_type alias for dest_type
  return results.map(r => ({
    ...r,
    search_type: r.search_type || r.dest_type,
  }));
}

// ── Hotel search ──────────────────────────────────────────────────────────────
async function searchHotels({
  dest_id,
  search_type,
  arrival_date,
  departure_date,
  adults        = 1,
  room_qty      = 1,
  currency_code = 'NZD',
}) {
  arrival_date   = fixPastDate(arrival_date);
  departure_date = fixPastDate(departure_date);

  return _get('/hotels/search', {
    dest_id,
    dest_type:       search_type,
    checkin_date:    arrival_date,
    checkout_date:   departure_date,
    adults_number:   adults,
    room_number:     room_qty,
    locale:          'en-gb',
    filter_by_currency: currency_code,
    order_by:        'popularity',
    units:           'metric',
    page_number:     0,
  });
}

// ── Flight summariser ─────────────────────────────────────────────────────────
function summarizeFlights(raw, maxResults = 5) {
  let offers = [];
  if (Array.isArray(raw)) {
    offers = raw;
  } else if (raw && typeof raw === 'object') {
    offers = raw.flightOffers
      || raw.data?.flightOffers
      || raw.data
      || [];
    if (offers && typeof offers === 'object' && !Array.isArray(offers)) {
      offers = offers.flightOffers || [];
    }
  }

  // Keyed by flight IDENTITY (not price) — airline, times, stops. Booking.com
  // often returns the same physical flight multiple times as separate fare
  // buckets (different booking class / refund policy) at different prices.
  // Since we don't currently surface WHY those prices differ, showing both
  // just looks like a bug ("same flight, different price?"). Instead we keep
  // only the CHEAPEST instance of each distinct flight.
  const seenFlights = new Map(); // dedupeKey -> summarized object

  for (const offer of offers) {
    try {
      const price    = offer.priceBreakdown?.total || {};
      const segments = offer.segments || [];
      const firstSeg = segments[0] || {};
      const legs     = firstSeg.legs || [];
      const airline  = legs[0]?.carriersData?.[0]?.name || 'Unknown airline';
      const stops    = legs.length - 1;

      // Return leg — segments[1] exists for round-trip offers
      const returnSeg  = segments[1] || null;
      const returnLegs = returnSeg?.legs || [];

      const summarized = {
        airline,
        price:            price.units != null ? parseFloat(price.units) : null,
        currency:         price.currencyCode || 'NZD',
        // ── Outbound leg ──
        departure_time:   firstSeg.departureTime,
        arrival_time:     firstSeg.arrivalTime,
        origin_code:      firstSeg.departureAirport?.code || '',
        destination_code: firstSeg.arrivalAirport?.code  || '',
        stops,
        is_direct:        stops === 0,
        duration_minutes: firstSeg.totalTime ? Math.floor(firstSeg.totalTime / 60) : null,
        // ── Return leg (null for one-way) ──
        return_departure_time:   returnSeg?.departureTime   || null,
        return_arrival_time:     returnSeg?.arrivalTime     || null,
        return_origin_code:      returnSeg?.departureAirport?.code || '',
        return_destination_code: returnSeg?.arrivalAirport?.code  || '',
        return_stops:            returnLegs.length > 1 ? returnLegs.length - 1 : 0,
        return_is_direct:        returnLegs.length <= 1,
        return_duration_minutes: returnSeg?.totalTime ? Math.floor(returnSeg.totalTime / 60) : null,
      };

      const dedupeKey = `${summarized.airline}|${summarized.departure_time}|${summarized.arrival_time}|${summarized.stops}`;
      const existing = seenFlights.get(dedupeKey);

      if (!existing || (summarized.price != null && summarized.price < existing.price)) {
        seenFlights.set(dedupeKey, summarized);
      }
    } catch (_) {}
  }

  const deduped = Array.from(seenFlights.values())
    .sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))
    .slice(0, maxResults);

  return deduped;
}

// ── Hotel summariser ──────────────────────────────────────────────────────────
function summarizeHotels(raw, maxResults = 5) {
  let hotels = [];
  if (Array.isArray(raw)) {
    hotels = raw;
  } else if (raw && typeof raw === 'object') {
    hotels = raw.result || raw.data?.hotels || raw.data || [];
  }

  return hotels.slice(0, maxResults).reduce((acc, hotel) => {
    try {
      const prop = hotel.property || {};
      acc.push({
        name:              hotel.hotel_name  || prop.name || 'Unknown',
        price:             hotel.min_total_price
                        || hotel.composite_price_breakdown?.gross_amount?.value
                        || null,
        currency:          'NZD',
        review_score:      hotel.review_score  || prop.reviewScore  || null,
        review_count:      hotel.review_nr     || prop.reviewCount   || null,
        stars:             hotel.class         || prop.propertyClass || null,
        photo_url:         hotel.max_photo_url || hotel.main_photo_url
                        || prop.photoUrls?.[0] || null,
        free_cancellation: !!(hotel.is_free_cancellable || hotel.free_cancellable),
        hotel_id:          hotel.hotel_id || null,
      });
    } catch (_) {}
    return acc;
  }, []);
}

module.exports = {
  searchFlightLocation,
  searchFlights,
  searchHotelDestination,
  searchHotels,
  summarizeFlights,
  summarizeHotels,
};
