/**
 * bookingController.js
 *
 * Called AFTER user confirms itinerary in chat.
 * Searches real flights and hotels per destination CARD and returns results
 * for the frontend to render as selectable cards inside the itinerary.
 *
 * Each destination card is searched independently and personalised to that
 * specific area — e.g. "Downtown Dubai" gets hotels near Burj Khalifa,
 * "Al Marmoom Desert Conservation Reserve" gets hotels/camps near the desert
 * reserve rather than falling back to generic city-wide results.
 *
 * Routes (all under /api/booking, all require auth):
 *   POST /api/booking/search   — main endpoint: searches flights + hotels for all destinations
 *   GET  /api/booking/flights/locations?query=Auckland
 *   GET  /api/booking/hotels/locations?query=Queenstown
 *
 * Place at: server/controllers/bookingController.js
 */

const booking = require('../services/bookingService');

// ── Resolve a location with fallback chain ────────────────────────────────────
// Booking.com's location search only recognises real places (cities, districts,
// landmarks it has indexed) — a narrow name like "Al Marmoom Desert Conservation
// Reserve" may return nothing. Instead of silently failing, we retry with
// progressively broader queries so the card still gets personalised (not
// generic) results wherever possible.
// Strip generic suffixes the AI sometimes appends (e.g. "Dubai City" → "Dubai")
// that aren't real indexed place names on Booking.com.
function stripGenericSuffix(name) {
  return name.replace(/\s+(City|District|Area|Region|Zone)$/i, '').trim();
}

async function resolveHotelLocation(destName, country, fallbackCity) {
  const cleaned = stripGenericSuffix(destName);
  const attempts = [
    destName,                                    // exact card name first — most specific
    cleaned !== destName ? cleaned : null,        // stripped of generic suffix (e.g. "Dubai" from "Dubai City")
    country ? `${destName}, ${country}` : null,   // name + country
    fallbackCity || null,                         // broader city (e.g. "Dubai")
  ].filter(Boolean);

  for (const query of attempts) {
    try {
      const locs = await booking.searchHotelDestination(query);
      if (locs.length > 0) return locs[0];
    } catch (_) { /* try next fallback */ }
  }
  return null;
}

async function resolveFlightLocation(destName, country, fallbackCity) {
  const cleaned = stripGenericSuffix(destName);
  const attempts = [
    destName,
    cleaned !== destName ? cleaned : null,
    country ? `${destName}, ${country}` : null,
    fallbackCity || null,
  ].filter(Boolean);

  for (const query of attempts) {
    try {
      const locs = await booking.searchFlightLocation(query);
      if (locs.length > 0) return locs[0];
    } catch (_) { /* try next fallback */ }
  }
  return null;
}

// ── POST /api/booking/search ──────────────────────────────────────────────────
/**
 * Body:
 * {
 *   origin: "Christchurch",          // where user is flying FROM
 *   fallbackCity: "Dubai",           // broader city, used only if a card's own
 *                                    // name can't be resolved (e.g. landmark names)
 *   destinations: [                  // from the confirmed plan — one per CARD
 *     { name: "Downtown Dubai", country: "UAE", ... },
 *     { name: "Al Marmoom Desert Conservation Reserve", country: "UAE", ... },
 *   ],
 *   depart_date:    "2026-09-10",
 *   return_date:    "2026-09-17",
 *   adults:         2,
 *   cabin_class:    "ECONOMY",       // optional
 *   totalBudget:    5000,            // optional — total trip budget in NZD.
 *                                    // Used to sort/filter hotels so they fit
 *                                    // the traveller's stated budget instead of
 *                                    // defaulting to "popularity" order.
 * }
 *
 * Returns: {
 *   destinations: [
 *     { name: "Downtown Dubai", flights: [...], hotels: [...], flightsSearched: true, noFlightsFound: false },
 *     ...
 *   ]
 * }
 */
const searchForItinerary = async (req, res) => {
  const {
    origin,
    fallbackCity,
    destinations,
    depart_date,
    return_date,
    adults      = 1,
    cabin_class = 'ECONOMY',
    totalBudget = null,
  } = req.body;

  if (!destinations || !Array.isArray(destinations) || destinations.length === 0) {
    return res.status(400).json({ error: 'destinations array is required.' });
  }
  if (!depart_date) {
    return res.status(400).json({ error: 'depart_date is required (YYYY-MM-DD).' });
  }

  // City-wide fallback so narrow/landmark card names still resolve to something
  // relevant instead of returning empty. Defaults to the first destination's
  // own name if no explicit city was supplied by the frontend.
  const cityFallback = fallbackCity || destinations[0]?.name || '';

  // Rough per-destination budget allocation. Flights are NOT divided evenly
  // across destination cards — a single round-trip international fare often
  // covers the entire visit (e.g. one destination card can represent many
  // attractions within the same city), so dividing it by card count massively
  // under-allocates. Hotels ARE split per destination since each card
  // typically represents a separate stay/leg of the trip.
  const perDestHotelBudget = totalBudget
    ? (totalBudget * 0.5) / destinations.length
    : null;
  const perLegFlightBudget = totalBudget
    ? totalBudget * 0.75
    : null;

  try {
    // ── Resolve origin airport once ───────────────────────────────────────────
    let originId = null;
    if (origin) {
      const originLoc = await resolveFlightLocation(origin, null, null);
      originId = originLoc?.id || originLoc?.code || null;
    }

    // ── Search each destination CARD independently, personalised to that area ──
    const results = await Promise.all(
      destinations.map(async (dest, idx) => {
        const destName = dest.name;
        let flights        = [];
        let hotels         = [];
        let flightsSearched = false;
        let noFlightsFound  = false;

        // ── Flights: personalised per card, with city fallback for landmark names ──
        try {
          const destLoc = await resolveFlightLocation(destName, dest.country, cityFallback);
          const destId  = destLoc?.id || destLoc?.code || null;

          if (destId) {
            const fromId = idx === 0
              ? originId
              : await (async () => {
                  const prevLoc = await resolveFlightLocation(
                    destinations[idx - 1].name, destinations[idx - 1].country, cityFallback
                  );
                  return prevLoc?.id || prevLoc?.code || null;
                })();

            if (fromId) {
              const tripDays  = destinations.length;
              const startDate = new Date(depart_date);
              const legDate   = new Date(startDate);
              legDate.setDate(startDate.getDate() + Math.floor((idx / tripDays) * (
                return_date
                  ? Math.max(1, Math.round((new Date(return_date) - startDate) / 86400000))
                  : 7
              )));
              const legDateStr = legDate.toISOString().split('T')[0];
              const isLastDest = idx === destinations.length - 1;

              flightsSearched = true;
              const flightRaw = await booking.searchFlights({
                from_id:     fromId,
                to_id:       destId,
                depart_date: legDateStr,
                return_date: isLastDest && return_date ? return_date : null,
                adults,
                cabin_class,
              });
              let allFlights = booking.summarizeFlights(flightRaw, 10);

              if (perLegFlightBudget) {
                allFlights.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
                const withinBudget = allFlights.filter(f => f.price != null && f.price <= perLegFlightBudget);

                if (withinBudget.length > 0) {
                  flights = withinBudget.slice(0, 5).map(f => ({ ...f, overBudget: false }));
                } else {
                  // Nothing fits — still show the 3 cheapest so the user has
                  // options, flagged so the UI can suggest raising the budget
                  // or trying different dates.
                  flights = allFlights.slice(0, 3).map(f => ({ ...f, overBudget: true }));
                }
              } else {
                flights = allFlights.slice(0, 5).map(f => ({ ...f, overBudget: false }));
              }

              if (flights.length === 0) noFlightsFound = true;
            }
          }
        } catch (err) {
          console.warn(`[bookingController] flight search failed for ${destName}:`, err.message);
          noFlightsFound = flightsSearched; // only flag if we actually attempted
        }

        // ── Hotels: personalised per card — tries the exact card area first,
        //    only widening to the fallback city if nothing is found for it ──
        try {
          const hotelLoc = await resolveHotelLocation(destName, dest.country, cityFallback);
          if (hotelLoc) {
            const { dest_id, search_type } = hotelLoc;

            const tripDays    = destinations.length;
            const startDate   = new Date(depart_date);
            const endDate     = return_date ? new Date(return_date) : new Date(startDate.getTime() + 7 * 86400000);
            const totalDays   = Math.max(1, Math.round((endDate - startDate) / 86400000));
            const daysPerDest = Math.max(1, Math.floor(totalDays / tripDays));

            const checkIn  = new Date(startDate);
            checkIn.setDate(startDate.getDate() + idx * daysPerDest);
            const checkOut = new Date(checkIn);
            checkOut.setDate(checkIn.getDate() + daysPerDest);

            const hotelRaw = await booking.searchHotels({
              dest_id,
              search_type,
              arrival_date:   checkIn.toISOString().split('T')[0],
              departure_date: checkOut.toISOString().split('T')[0],
              adults,
            });

            // Pull more candidates than we'll show so budget filtering has
            // something to work with, instead of just the top-5 "popularity" ones.
            let allHotels = booking.summarizeHotels(hotelRaw, 20);

            if (perDestHotelBudget) {
              // Sort cheapest-first so budget-conscious options surface top.
              allHotels.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));

              const withinBudget = allHotels.filter(h => h.price != null && h.price <= perDestHotelBudget);

              if (withinBudget.length > 0) {
                hotels = withinBudget.slice(0, 5).map(h => ({ ...h, overBudget: false }));
              } else {
                // Nothing fits — show the 3 cheapest available so the user still
                // has options, but flag them so the UI can warn clearly.
                hotels = allHotels.slice(0, 3).map(h => ({ ...h, overBudget: true }));
              }
            } else {
              // No budget provided — keep previous behaviour (top 5, unsorted).
              hotels = allHotels.slice(0, 5).map(h => ({ ...h, overBudget: false }));
            }
          }
        } catch (err) {
          console.warn(`[bookingController] hotel search failed for ${destName}:`, err.message);
        }

        return { name: destName, flights, hotels, flightsSearched, noFlightsFound };
      })
    );

    return res.status(200).json({ destinations: results });

  } catch (err) {
    console.error('[bookingController] searchForItinerary error:', err);
    return res.status(500).json({ error: 'Booking search failed. Please try again.' });
  }
};

// ── GET /api/booking/flights/locations ────────────────────────────────────────
const flightLocations = async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'query param required.' });
  try {
    const results = await booking.searchFlightLocation(query);
    return res.status(200).json({ locations: results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── GET /api/booking/hotels/locations ─────────────────────────────────────────
const hotelLocations = async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'query param required.' });
  try {
    const results = await booking.searchHotelDestination(query);
    return res.status(200).json({ destinations: results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { searchForItinerary, flightLocations, hotelLocations };
