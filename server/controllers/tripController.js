/**
 * tripController.js
 *
 * Handles AI trip planning:
 *  - planTrip: POST /api/trips/plan — accepts trip description, returns AI-generated plan
 *	- saveTrip:      POST /api/trips/save      — persists a generated plan to the database
 *  - getUserTrips:  GET  /api/trips           — returns all trips for the authenticated user
 *  - modifyTrip:    PUT  /api/trips/:id       — updates an existing trip (partial or full)
 *
 * Uses OpenAI GPT-4o with structured JSON output when OPENAI_API_KEY is set.
 * Falls back to a hardcoded mock plan when the key is not configured.
 */
const { isConfigured, generateTripPlan, generateAgenticChatResponse } = require('../utils/openaiHelper');
const { scrapeBookmeDeals } = require('../utils/bookmeScraper');
const booking = require('../services/bookingService');
const pool = require('../config/db');

// ── Deterministic search + budget check ───────────────────────────────────────
// The AI model's decision to call tools mid-conversation is not reliable
// enough on its own — it can generate a full itinerary without ever searching
// real prices, leading to chat text confidently claiming "within budget" with
// nothing real behind it. This guarantees a real search happens and the
// budget comparison is done in CODE, not left to the model's discretion.
async function deterministicBudgetCheck(plan, originCity, departDate, returnDate, travelers, budgetAmount) {
  const firstDest = plan?.destinations?.[0];
  if (!firstDest) return null;

  try {
    const originLoc = originCity ? (await booking.searchFlightLocation(originCity))[0] : null;
    const destLoc    = (await booking.searchFlightLocation(firstDest.name))[0]
                     || (await booking.searchFlightLocation(firstDest.name.replace(/\s+City$/i, '')))[0];

    // Return the FULL sorted list, not just the cheapest — this was previously
    // hardcoded to a single-item array, which meant "give me more options"
    // could never show more than one flight/hotel whenever this fallback ran.
    let flights = [];
    if (originLoc && destLoc) {
      const fromId = originLoc.id || originLoc.code;
      const toId   = destLoc.id || destLoc.code;
      if (fromId && toId && departDate) {
        const raw = await booking.searchFlights({
          from_id: fromId, to_id: toId, depart_date: departDate,
          return_date: returnDate || null, adults: travelers || 1,
        });
        flights = booking.summarizeFlights(raw, 10);
        flights.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
      }
    }

    const hotelLoc = (await booking.searchHotelDestination(firstDest.name))[0]
                    || (await booking.searchHotelDestination(firstDest.name.replace(/\s+City$/i, '')))[0];

    let hotels = [];
    if (hotelLoc && departDate) {
      const checkOut = returnDate || new Date(new Date(departDate).getTime() + 6 * 86400000).toISOString().split('T')[0];
      const raw = await booking.searchHotels({
        dest_id: hotelLoc.dest_id, search_type: hotelLoc.search_type,
        arrival_date: departDate, departure_date: checkOut, adults: travelers || 1,
      });
      hotels = booking.summarizeHotels(raw, 10);
      hotels.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    }

    const cheapestFlightPrice = flights[0]?.price || 0;
    const cheapestHotelPrice  = hotels[0]?.price  || 0;
    const cheapestTotal = cheapestFlightPrice + cheapestHotelPrice;
    const fitsBudget = budgetAmount > 0 ? cheapestTotal <= budgetAmount : null;

    return {
      flights,
      hotels,
      cheapestTotal,
      fitsBudget,
    };
  } catch (err) {
    console.error('[deterministicBudgetCheck] Error:', err.message);
    return null;
  }
}

// ── Mock fallback (used when OPENAI_API_KEY is not set) ─────────────────────
function generateMockPlan(description) {
  const desc = description.toLowerCase();
  let region = 'default';
  let summary = '';

  if (desc.includes('japan') || desc.includes('tokyo') || desc.includes('kyoto')) {
    region = 'japan';
    summary = "I've crafted a mountain-focused Japan itinerary. You'll experience Tokyo's essential highlights, then escape to the Japanese Alps in Takayama, and finish in Hakone for stunning Mt. Fuji views and traditional hot springs.";
  } else if (desc.includes('europe') || desc.includes('paris') || desc.includes('rome')) {
    region = 'europe';
    summary = "I've designed a European discovery itinerary featuring iconic cities and cultural landmarks. This trip balances history, art, cuisine, and scenic beauty across Western Europe.";
  } else {
    summary = "Based on your description, I've put together a diverse travel itinerary featuring stunning destinations with unique experiences.";
  }

  const MOCK = {
    japan: [
      { id: 'tokyo', name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, emoji: '⛩️', highlights: ['Senso-ji Temple', 'Shibuya Crossing', 'Meiji Shrine', 'Akihabara'] },
      { id: 'takayama', name: 'Takayama', country: 'Japan', lat: 36.1461, lng: 137.2522, emoji: '🏔️', highlights: ['Matsumoto Castle', 'Japanese Alps', 'Old Town streets'] },
      { id: 'hakone', name: 'Hakone', country: 'Japan', lat: 35.2326, lng: 139.1070, emoji: '♨️', highlights: ['Lake Ashi', 'Mt. Fuji views', 'Hot springs'] },
    ],
    europe: [
      { id: 'paris', name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, emoji: '🗼', highlights: ['Eiffel Tower', 'Louvre Museum', 'Montmartre'] },
      { id: 'rome', name: 'Rome', country: 'Italy', lat: 41.9028, lng: 12.4964, emoji: '🏛️', highlights: ['Colosseum', 'Vatican City', 'Trevi Fountain'] },
      { id: 'barcelona', name: 'Barcelona', country: 'Spain', lat: 41.3874, lng: 2.1686, emoji: '🎭', highlights: ['Sagrada Familia', 'Park Güell', 'La Rambla'] },
    ],
    default: [
      { id: 'bali', name: 'Bali', country: 'Indonesia', lat: -8.3405, lng: 115.0920, emoji: '🏝️', highlights: ['Ubud Rice Terraces', 'Tanah Lot Temple', 'Beaches'] },
      { id: 'nyc', name: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060, emoji: '🗽', highlights: ['Times Square', 'Central Park', 'Statue of Liberty'] },
      { id: 'sydney', name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093, emoji: '🦘', highlights: ['Opera House', 'Harbour Bridge', 'Bondi Beach'] },
    ],
  };

  const travelerMatch = desc.match(/(\d+)\s*(person|people|traveler|travelers|pax)/);
  const dayMatch = desc.match(/(\d+)\s*(day|days|night|nights)/);

  return {
    summary,
    destinations: MOCK[region],
    suggestions: [{ id: 'kyoto', name: 'Kyoto', country: 'Japan', emoji: '🏯' }],
    startCity: 'San Francisco',
    travelers: travelerMatch ? parseInt(travelerMatch[1], 10) : 2,
    days: dayMatch ? parseInt(dayMatch[1], 10) : 7,
    budgetLevel: desc.includes('budget') ? 'budget' : 'moderate',
  };
}

// HARDCODED JSON response from OpenAPI for NZ trip. JUST FOR TESTING --- To remove this block to enable back real AI generation
const HARDCODED_NZ_RESPONSE = {
  "message": "Your Trip plan generated successfully.",
  "source": "ai",
  "plan": {
    "summary": "Get ready to explore the breathtaking landscapes of Kiwi Land (New Zealand) and Dubai on a budget-friendly adventure. We'll start our journey in Auckland, experiencing its vibrant culture, before heading to the geothermal wonders of Rotorua. Then, it's off to the stunning natural beauty of Tongariro National Park and the relaxing beaches of Tauranga. Finally, we'll wrap up with a visit to the artistic and cultural hub of Wellington.",
    "destinations": [
      {
        "id": "auckland",
        "name": "Auckland",
        "country": "New Zealand",
        "lat": -36.8485,
        "lng": 174.7633,
        "emoji": "🌆",
        "highlights": [
          "Auckland War Memorial Museum",
          "Sky Tower",
          "Waiheke Island"
        ],
        "bookmeDeals": [
          {
            "title": "Top Rated Auckland Guided Tour",
            "price": "From $49",
            "originalPrice": "$89",
            "discount": "45% Off",
            "image": "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=800&auto=format&fit=crop",
            "link": "https://www.bookme.co.nz/things-to-do/auckland/activities/tours/sightseeing-scenic-tours"
          },
          {
            "title": "Best of Auckland - Adventure Day",
            "price": "From $120",
            "originalPrice": "$150",
            "discount": "20% Off",
            "image": "https://images.unsplash.com/photo-1533587851505-d119e13bf0eb?q=80&w=800&auto=format&fit=crop",
            "link": "https://www.bookme.co.nz/things-to-do/auckland/activities/adventure"
          }
        ]
      },
      {
        "id": "rotorua",
        "name": "Rotorua",
        "country": "New Zealand",
        "lat": -38.1368,
        "lng": 176.2497,
        "emoji": "🌋",
        "highlights": [
          "Te Puia",
          "Rotorua Museum",
          "Redwoods Treewalk"
        ],
        "bookmeDeals": [
          {
            "title": "Top Rated Rotorua Guided Tour",
            "price": "From $49",
            "originalPrice": "$89",
            "discount": "45% Off",
            "image": "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=800&auto=format&fit=crop",
            "link": "https://www.bookme.co.nz/things-to-do/rotorua-taupo/activities/tours/sightseeing-scenic-tours"
          },
          {
            "title": "Best of Rotorua - Adventure Day",
            "price": "From $120",
            "originalPrice": "$150",
            "discount": "20% Off",
            "image": "https://images.unsplash.com/photo-1506509923831-7b0b30efec98?q=80&w=800&auto=format&fit=crop",
            "link": "https://www.bookme.co.nz/things-to-do/rotorua-taupo/activities/adventure"
          }
        ]
      },
      {
        "id": "tongariro-national-park",
        "name": "Tongariro National Park",
        "country": "New Zealand",
        "lat": -39.2908,
        "lng": 175.5626,
        "emoji": "⛰️",
        "highlights": [
          "Tongariro Alpine Crossing",
          "Mount Ngauruhoe",
          "Whakapapa Village"
        ],
        "bookmeDeals": [
          {
            "title": "Top Rated Tongariro National Park Guided Tour",
            "price": "From $49",
            "originalPrice": "$89",
            "discount": "45% Off",
            "image": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop",
            "link": "https://www.bookme.co.nz/things-to-do/tongariro-national-park/activities/tours/sightseeing-scenic-tours"
          },
          {
            "title": "Best of Tongariro National Park - Adventure Day",
            "price": "From $120",
            "originalPrice": "$150",
            "discount": "20% Off",
            "image": "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=800&auto=format&fit=crop",
            "link": "https://www.bookme.co.nz/things-to-do/tongariro-national-park/activities/adventure"
          }
        ]
      },
      {
        "id": "tauranga",
        "name": "Tauranga",
        "country": "New Zealand",
        "lat": -37.6869,
        "lng": 176.1651,
        "emoji": "🏖️",
        "highlights": [
          "Mount Maunganui",
          "The Elms Mission Station",
          "Tauranga Art Gallery"
        ],
        "bookmeDeals": [
          {
            "title": "Top Rated Tauranga Guided Tour",
            "price": "From $49",
            "originalPrice": "$89",
            "discount": "45% Off",
            "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop",
            "link": "https://www.bookme.co.nz/things-to-do/tauranga/activities/tours/sightseeing-scenic-tours"
          },
          {
            "title": "Best of Tauranga - Adventure Day",
            "price": "From $120",
            "originalPrice": "$150",
            "discount": "20% Off",
            "image": "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=800&auto=format&fit=crop",
            "link": "https://www.bookme.co.nz/things-to-do/tauranga/activities/adventure"
          }
        ]
      },
      {
        "id": "wellington",
        "name": "Wellington",
        "country": "New Zealand",
        "lat": -41.2865,
        "lng": 174.7762,
        "emoji": "🌧️",
        "highlights": [
          "Te Papa Museum",
          "Wellington Botanical Gardens",
          "Cuba Street"
        ],
        "bookmeDeals": [
          {
            "title": "Top Rated Wellington Guided Tour",
            "price": "From $49",
            "originalPrice": "$89",
            "discount": "45% Off",
            "image": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop",
            "link": "https://www.bookme.co.nz/things-to-do/wellington-wairarapa/activities/tours/sightseeing-scenic-tours"
          },
          {
            "title": "Best of Wellington - Adventure Day",
            "price": "From $120",
            "originalPrice": "$150",
            "discount": "20% Off",
            "image": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=800&auto=format&fit=crop",
            "link": "https://www.bookme.co.nz/things-to-do/wellington-wairarapa/activities/adventure"
          }
        ]
      }
    ],
    "suggestions": [
      {
        "id": "queenstown",
        "name": "Queenstown",
        "country": "New Zealand",
        "emoji": "🏞️"
      },
      {
        "id": "christchurch",
        "name": "Christchurch",
        "country": "New Zealand",
        "emoji": "🌿"
      },
      {
        "id": "dunedin",
        "name": "Dunedin",
        "country": "New Zealand",
        "emoji": "🏰"
      }
    ],
    "startCity": "Auckland",
    "travelers": 1,
    "days": 7,
    "budgetLevel": "budget"
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PLAN TRIP  —  POST /api/trips/plan
// ═══════════════════════════════════════════════════════════════════════════════
const planTrip = async (req, res) => {
  // HARDCODED BYPASS FOR TESTING --- To remove this block to enable back real AI generation
  return res.status(200).json(HARDCODED_NZ_RESPONSE);
  
  const { userId } = req.user;
  const { description, instantPlan } = req.body;

  if (!description || !description.trim()) {
    return res.status(400).json({ error: 'Please describe your trip.' });
  }

  try {
    let plan;
    let source;

    if (isConfigured()) {
      // ── Real AI path ────────────────────────────────────────────────────────
      plan = await generateTripPlan(description.trim());
      source = 'ai';
      console.log(`[planTrip] AI plan generated for user ${userId}`);
    } else {
      // ── Mock fallback (no OPENAI_API_KEY) ────────────────────────────────
      plan = generateMockPlan(description.trim());
      source = 'mock';
      console.warn('[planTrip] OPENAI_API_KEY not set — returning mock plan.');
    }

    if (plan && plan.destinations && Array.isArray(plan.destinations)) {
      console.log('[planTrip] Fetching Bookme deals for destinations...');
      await Promise.all(plan.destinations.map(async (destination) => {
        if (destination.name) {
          const deals = await scrapeBookmeDeals(destination.name);
          if (deals && deals.length > 0) {
            destination.bookmeDeals = deals;
          }
        }
      }));
    }

    return res.status(200).json({
      message: 'Trip plan generated successfully.',
      source,
      plan,
    });
  } catch (err) {
    console.error('[planTrip] Error:', err.message);

    // Provide a more specific error for common OpenAI issues
    if (err.status === 401 || err.code === 'invalid_api_key') {
      return res.status(502).json({ error: 'AI service authentication failed. Please check your API key.' });
    }
    if (err.status === 429) {
      return res.status(429).json({ error: 'AI rate limit exceeded. Please try again in a moment.' });
    }
    if (err.code === 'insufficient_quota') {
      return res.status(402).json({ error: 'AI quota exceeded. Please check your billing.' });
    }

    return res.status(500).json({ error: 'Failed to generate trip plan. Please try again.' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SAVE TRIP  —  POST /api/trips/save
// ═══════════════════════════════════════════════════════════════════════════════
const saveTrip = async (req, res) => {
  const { userId } = req.user;
  const {
    plan,
    title,
    selectedComponents,
    totalPricePerPerson,
    totalPriceAll,
    selectedPackageIds,
  } = req.body;

  if (!plan || !plan.destinations) {
    return res.status(400).json({ error: 'Invalid trip plan data.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Insert the trip
    const tripQuery = `
	INSERT INTO trips (user_id, title, summary, start_city, travelers, days, budget_level, suggestions,
	                         selected_components, total_price_per_person, total_price_all, selected_package_ids)
	      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	      RETURNING id;
	    `;
	    const tripValues = [
	      userId,
	      title || null,
	      plan.summary,
	      plan.startCity,
	      plan.travelers || 1,
	      plan.days || 1,
	      plan.budgetLevel || 'moderate', // fallback — split-budget scenarios leave this blank, but the DB column may have a CHECK constraint requiring a non-empty enum value
	      JSON.stringify(plan.suggestions || []),
	      JSON.stringify(selectedComponents || []),
	      totalPricePerPerson || 0,
	      totalPriceAll || 0,
	      JSON.stringify(selectedPackageIds || []),
    ];
    
    const tripRes = await client.query(tripQuery, tripValues);
    const tripId = tripRes.rows[0].id;

    // 2. Insert destinations
    const destQuery = `
      INSERT INTO destinations (trip_id, destination_id, name, country, lat, lng, emoji, highlights, bookme_deals, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
    `;

    for (let i = 0; i < plan.destinations.length; i++) {
      const dest = plan.destinations[i];
      const destValues = [
        tripId,
        dest.id,
        dest.name,
        dest.country,
        dest.lat,
        dest.lng,
        dest.emoji,
        JSON.stringify(dest.highlights || []),
        JSON.stringify(dest.bookmeDeals || []),
        i
      ];
      await client.query(destQuery, destValues);
    }

    await client.query('COMMIT');
    return res.status(201).json({ success: true, tripId });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[saveTrip] Transaction error:', err);
    return res.status(500).json({ error: 'Failed to save trip to the database.' });
  } finally {
    client.release();
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// GET USER TRIPS  —  GET /api/trips
// ═══════════════════════════════════════════════════════════════════════════════
const getUserTrips = async (req, res) => {
  const { userId } = req.user;
  
  try {
    const query = `
      SELECT 
        t.id, t.title, t.summary, t.start_city, t.travelers, t.days, t.budget_level, t.status, t.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', d.destination_id,
              'name', d.name,
              'country', d.country,
              'emoji', d.emoji,
              'highlights', d.highlights,
              'bookmeDeals', d.bookme_deals
            ) ORDER BY d.sort_order
          ) FILTER (WHERE d.id IS NOT NULL),
          '[]'
        ) AS destinations
      FROM trips t
      LEFT JOIN destinations d ON t.id = d.trip_id
      WHERE t.user_id = $1 
      GROUP BY t.id
      ORDER BY t.created_at DESC;
    `;
    const result = await pool.query(query, [userId]);
    return res.status(200).json({ trips: result.rows });
  } catch (err) {
    console.error('[getUserTrips] Error:', err);
    return res.status(500).json({ error: 'Failed to fetch saved trips.' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODIFY TRIP  —  PUT /api/trips/:id
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Supports partial updates. Any combination of the following fields may be sent:
 *
 *   title        {string}   — human-readable trip name
 *   summary      {string}   — AI-generated or user-edited trip summary
 *   days         {number}   — total trip duration
 *   travelers    {number}   — number of travellers
 *   budgetLevel  {string}   — 'budget' | 'moderate' | 'luxury'
 *   suggestions  {array}    — array of suggested-but-not-included destination objects
 *   destinations {array}    — full replacement of the destination list (atomic swap)
 *
 * Omitted fields are left unchanged. If `destinations` is supplied it must be a
 * non-empty array; the existing destination rows are deleted and replaced inside a
 * single transaction so the operation is all-or-nothing.
 */
const modifyTrip = async (req, res) => {
  const { userId } = req.user;
  const tripId = req.params.id;

  if (!tripId) {
    return res.status(400).json({ error: 'Invalid trip ID.' });
  }

  const { title, summary, days, travelers, budgetLevel, suggestions, destinations } = req.body;

  // Must supply at least one field to update
  const hasScalarUpdate = [title, summary, days, travelers, budgetLevel, suggestions].some(
    (v) => v !== undefined
  );
  const hasDestinationUpdate = destinations !== undefined;

  if (!hasScalarUpdate && !hasDestinationUpdate) {
    return res.status(400).json({ error: 'No updatable fields provided.' });
  }

  // Basic validation for destinations when supplied
  if (hasDestinationUpdate) {
    if (!Array.isArray(destinations) || destinations.length === 0) {
      return res.status(400).json({ error: 'destinations must be a non-empty array.' });
    }
	for (const dest of destinations) {
	      if (!dest.name || !dest.name.trim()) {
	        return res.status(400).json({
	          error: 'Each destination must include a name.',
        });
      }
    }
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ── 1. Ownership check ───────────────────────────────────────────────────
    const ownerCheck = await client.query(
      'SELECT id FROM trips WHERE id = $1 AND user_id = $2',
      [tripId, userId]
    );
    if (ownerCheck.rowCount === 0) {
      await client.query('ROLLBACK');
      // Return 404 regardless of whether the row exists — avoids ID enumeration
      return res.status(404).json({ error: 'Trip not found.' });
    }

    // ── 2. Build the scalar UPDATE dynamically (only changed fields) ─────────
    if (hasScalarUpdate) {
      const setClauses = [];
      const values = [];
      let idx = 1;

      if (title !== undefined)       { setClauses.push(`title = $${idx++}`);        values.push(title); }
      if (summary !== undefined)     { setClauses.push(`summary = $${idx++}`);      values.push(summary); }
      if (days !== undefined)        { setClauses.push(`days = $${idx++}`);         values.push(days); }
      if (travelers !== undefined)   { setClauses.push(`travelers = $${idx++}`);    values.push(travelers); }
      if (budgetLevel !== undefined) { setClauses.push(`budget_level = $${idx++}`); values.push(budgetLevel); }
      if (suggestions !== undefined) { setClauses.push(`suggestions = $${idx++}`);  values.push(JSON.stringify(suggestions)); }

      // Always bump updated_at if the column exists on the table
      setClauses.push(`updated_at = NOW()`);

      values.push(tripId); // final param for WHERE clause
      await client.query(
        `UPDATE trips SET ${setClauses.join(', ')} WHERE id = $${idx}`,
        values
      );
    }

    // ── 3. Atomic destination swap ───────────────────────────────────────────
    if (hasDestinationUpdate) {
      // Delete all existing destination rows for this trip
      await client.query('DELETE FROM destinations WHERE trip_id = $1', [tripId]);

      const destInsert = `
        INSERT INTO destinations
          (trip_id, destination_id, name, country, lat, lng, emoji, highlights, bookme_deals, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;

      for (let i = 0; i < destinations.length; i++) {
        const dest = destinations[i];
		const lat = dest.lat != null && dest.lat !== '' && !isNaN(Number(dest.lat)) ? Number(dest.lat) : null;
		const lng = dest.lng != null && dest.lng !== '' && !isNaN(Number(dest.lng)) ? Number(dest.lng) : null;
        await client.query(destInsert, [
          tripId,
          dest.id   || dest.name.toLowerCase().replace(/\s+/g, '-'),
          dest.name,
          dest.country  || null,
		  lat,
		  lng,
          dest.emoji    || null,
          JSON.stringify(dest.highlights   || []),
          JSON.stringify(dest.bookmeDeals  || []),
          i,
        ]);
      }
    }

    await client.query('COMMIT');

    // ── 4. Return the full updated trip ──────────────────────────────────────
    const updatedTrip = await pool.query(
      `
      SELECT
        t.id, t.title, t.summary, t.start_city, t.travelers, t.days,
        t.budget_level, t.status, t.created_at, t.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id',          d.destination_id,
              'name',        d.name,
              'country',     d.country,
              'lat',         d.lat,
              'lng',         d.lng,
              'emoji',       d.emoji,
              'highlights',  d.highlights,
              'bookmeDeals', d.bookme_deals
            ) ORDER BY d.sort_order
          ) FILTER (WHERE d.id IS NOT NULL),
          '[]'
        ) AS destinations
      FROM trips t
      LEFT JOIN destinations d ON t.id = d.trip_id
      WHERE t.id = $1
      GROUP BY t.id
      `,
      [tripId]
    );

    return res.status(200).json({
      message: 'Trip updated successfully.',
      trip: updatedTrip.rows[0],
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[modifyTrip] Transaction error:', err);
    return res.status(500).json({ error: 'Failed to update trip.' });
  } finally {
    client.release();
  }
};


// ═══════════════════════════════════════════════════════════════════════════════
// DELETE TRIP  —  DELETE /api/trips/:id
// ═══════════════════════════════════════════════════════════════════════════════
const deleteTrip = async (req, res) => {
  const { userId } = req.user;
  const tripId = req.params.id;

  if (!tripId) {
    return res.status(400).json({ error: 'Invalid trip ID.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Ownership check
    const ownerCheck = await client.query(
      'SELECT id FROM trips WHERE id = $1 AND user_id = $2',
      [tripId, userId]
    );
    if (ownerCheck.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Trip not found.' });
    }

    // Delete destinations first (FK), then the trip
    await client.query('DELETE FROM destinations WHERE trip_id = $1', [tripId]);
    await client.query('DELETE FROM trips WHERE id = $1', [tripId]);

    await client.query('COMMIT');
    return res.status(200).json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[deleteTrip] Error:', err);
    return res.status(500).json({ error: 'Failed to delete trip.' });
  } finally {
    client.release();
  }
};


// ═══════════════════════════════════════════════════════════════════════════════
// GET SINGLE TRIP  —  GET /api/trips/:id
// ═══════════════════════════════════════════════════════════════════════════════
const getTripById = async (req, res) => {
  const { userId } = req.user;
  const tripId = req.params.id;

  if (!tripId) return res.status(400).json({ error: 'Invalid trip ID.' });

  try {
    const result = await pool.query(
      `SELECT
        t.id, t.title, t.summary, t.start_city, t.travelers, t.days,
        t.budget_level, t.status, t.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id',          d.destination_id,
              'name',        d.name,
              'country',     d.country,
              'lat',         d.lat,
              'lng',         d.lng,
              'emoji',       d.emoji,
              'highlights',  d.highlights,
              'bookmeDeals', d.bookme_deals
            ) ORDER BY d.sort_order
          ) FILTER (WHERE d.id IS NOT NULL),
          '[]'
        ) AS destinations
      FROM trips t
      LEFT JOIN destinations d ON t.id = d.trip_id
      WHERE t.id = $1 AND t.user_id = $2
      GROUP BY t.id`,
      [tripId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Trip not found.' });
    }
    return res.status(200).json({ trip: result.rows[0] });
  } catch (err) {
    console.error('[getTripById] Error:', err);
    return res.status(500).json({ error: 'Failed to fetch trip.' });
  }
};

function generateMockChatResponse(messages) {
  const latestMessage = messages[messages.length - 1]?.content || '';
  const desc = latestMessage.toLowerCase();
  
  let destination = '';
  if (desc.includes('japan') || desc.includes('tokyo') || desc.includes('kyoto')) destination = 'Japan';
  else if (desc.includes('europe') || desc.includes('paris') || desc.includes('rome')) destination = 'Europe';
  else if (desc.includes('new zealand') || desc.includes('nz') || desc.includes('auckland')) destination = 'New Zealand';
  
  const travelerMatch = desc.match(/(\d+)\s*(person|people|traveler|travelers|pax)/);
  const dayMatch = desc.match(/(\d+)\s*(day|days|night|nights)/);
  
  let budgetLevel = '';
  if (desc.includes('budget')) budgetLevel = 'budget';
  else if (desc.includes('luxury')) budgetLevel = 'luxury';
  else if (desc.includes('moderate')) budgetLevel = 'moderate';
  
  let location_types = [];
  if (desc.includes('beach')) location_types.push('Beach');
  if (desc.includes('mountain') || desc.includes('hiking')) location_types.push('Mountain');
  if (desc.includes('city') || desc.includes('shopping')) location_types.push('City');
  if (desc.includes('history') || desc.includes('culture')) location_types.push('Culture');
  if (desc.includes('food') || desc.includes('eating')) location_types.push('Food');

  const extractedPreferences = {
    destination: destination || '',
    days: dayMatch ? parseInt(dayMatch[1], 10) : 0,
    travelers: travelerMatch ? parseInt(travelerMatch[1], 10) : 0,
    budgetLevel: budgetLevel || '',
    location_types: location_types
  };
  
  let responseText = '';
  let readyToPlan = false;
  
  if (!destination) {
    responseText = "Hello! I am your interactive TravelAI consultant. Where are you planning to go for your next adventure?";
  } else if (!dayMatch) {
    responseText = `Awesome, ${destination} is a fantastic choice! How many days are you planning to spend there?`;
  } else if (!travelerMatch) {
    responseText = `Got it, a ${dayMatch[1]}-day trip to ${destination}. How many travelers will be joining you?`;
  } else if (!budgetLevel) {
    responseText = `Understood. What is your budget style? Are we looking at a 'budget', 'moderate', or 'luxury' trip?`;
  } else {
    responseText = `Perfect! I have all the details: a ${dayMatch[1]}-day ${budgetLevel} trip to ${destination} for ${travelerMatch[1]} traveler(s). Let me put together the perfect itinerary for you!`;
    readyToPlan = true;
  }
  
  // If ready, we can return the mock plan
  let plan = {
    summary: '',
    destinations: [],
    suggestions: [],
    startCity: '',
    travelers: 0,
    days: 0,
    budgetLevel: ''
  };
  
  if (readyToPlan) {
    // Generate a quick mock plan
    let region = 'default';
    if (destination.toLowerCase().includes('japan')) region = 'japan';
    else if (destination.toLowerCase().includes('europe')) region = 'europe';
    
    const MOCK = {
      japan: [
        { id: 'tokyo', name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, emoji: '⛩️', highlights: ['Senso-ji Temple', 'Shibuya Crossing', 'Meiji Shrine'] },
        { id: 'takayama', name: 'Takayama', country: 'Japan', lat: 36.1461, lng: 137.2522, emoji: '🏔️', highlights: ['Matsumoto Castle', 'Japanese Alps', 'Old Town streets'] },
        { id: 'hakone', name: 'Hakone', country: 'Japan', lat: 35.2326, lng: 139.1070, emoji: '♨️', highlights: ['Lake Ashi', 'Mt. Fuji views', 'Hot springs'] },
      ],
      europe: [
        { id: 'paris', name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, emoji: '🗼', highlights: ['Eiffel Tower', 'Louvre Museum', 'Montmartre'] },
        { id: 'rome', name: 'Rome', country: 'Italy', lat: 41.9028, lng: 12.4964, emoji: '🏛️', highlights: ['Colosseum', 'Vatican City', 'Trevi Fountain'] },
      ],
      default: [
        { id: 'auckland', name: 'Auckland', country: 'New Zealand', lat: -36.8485, lng: 174.7633, emoji: '🌆', highlights: ['Sky Tower', 'Auckland War Memorial Museum', 'Waiheke Island'] },
        { id: 'rotorua', name: 'Rotorua', country: 'New Zealand', lat: -38.1368, lng: 176.2497, emoji: '🌋', highlights: ['Te Puia', 'Rotorua Museum', 'Redwoods Treewalk'] },
      ]
    };
    
    plan = {
      summary: `I've put together a wonderful custom itinerary for your trip to ${destination}.`,
      destinations: MOCK[region],
      suggestions: [{ id: 'queenstown', name: 'Queenstown', country: 'New Zealand', emoji: '🏔️' }],
      startCity: MOCK[region][0].name,
      travelers: travelerMatch ? parseInt(travelerMatch[1], 10) : 2,
      days: dayMatch ? parseInt(dayMatch[1], 10) : 7,
      budgetLevel: budgetLevel || 'moderate'
    };
  }
  
  return {
    message: responseText,
    extractedPreferences,
    readyToPlan,
    plan
  };
}

const chatWithAI = async (req, res) => {
  console.log('>>>>> RUNNING FIXED chatWithAI in tripController.js — MARKER v3 <<<<<');
  const { userId } = req.user;
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages history.' });
  }

  try {
    let result;
    if (isConfigured()) {
      result = await generateAgenticChatResponse(messages);
    } else {
      result = generateMockChatResponse(messages);
    }

    // ── Server-side safety net: never trust readyToPlan blindly. originCity
    // is mandatory for flight search — if the model ever sets readyToPlan
    // true without it, force it back to false rather than let a plan through
    // with no way to search flights.
    const originCity = result.extractedPreferences?.originCity;
    if (result.readyToPlan && (!originCity || !originCity.trim())) {
      console.warn('[chatWithAI] readyToPlan was true but originCity missing — overriding to false.');
      result.readyToPlan = false;
      if (!result.message || !result.message.toLowerCase().includes('flying from')) {
        result.message += ' Also, which city will you be flying from? I need this to find your flights.';
      }
    }

    // Save extracted preferences to user_preferences table in DB if we extracted any fields
    const { destination, days, budgetLevel, location_types, budgetAmount } = result.extractedPreferences || {};
    
    if (destination || days || budgetLevel || (location_types && location_types.length > 0)) {
      // Find or upsert user_preferences
      await pool.query(
        `INSERT INTO user_preferences (user_id, destination, budget_amount, location_types, travel_style, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (user_id) DO UPDATE SET
           destination    = COALESCE(NULLIF($2, ''), user_preferences.destination),
           budget_amount  = COALESCE($3, user_preferences.budget_amount),
           location_types = CASE WHEN jsonb_array_length($4::jsonb) > 0 THEN $4::jsonb ELSE user_preferences.location_types END,
           travel_style   = COALESCE($5, user_preferences.travel_style),
           updated_at     = NOW()`,
        [
          userId,
          destination || null,
          // Prefer the exact numeric figure the traveller stated over the category guess.
          (budgetAmount && budgetAmount > 0) ? budgetAmount
            : (budgetLevel === 'budget' ? 1000 : budgetLevel === 'luxury' ? 5000 : budgetLevel === 'moderate' ? 2500 : null),
          JSON.stringify(location_types || []),
          JSON.stringify({ budgetLevel: budgetLevel || null, days: days || null })
        ]
      );
    }

    // If ready to plan, scrape Bookme deals for destinations
    if (result.readyToPlan && result.plan && result.plan.destinations && Array.isArray(result.plan.destinations)) {
      console.log('[chatWithAI] Fetching Bookme deals for destinations...');
      await Promise.all(result.plan.destinations.map(async (destinationObj) => {
        if (destinationObj.name) {
          const deals = await scrapeBookmeDeals(destinationObj.name);
          if (deals && deals.length > 0) {
            destinationObj.bookmeDeals = deals;
          }
        }
      }));
    }

    // ── DETERMINISTIC budget check — do not rely on the model having chosen
    // to call tools itself, and do not skip this just because the agentic
    // path already found some flights — we still verify THOSE results
    // against budget and correct the message if it contradicts reality.
    const departDate = result.extractedPreferences?.departDate;
    const returnDate  = result.extractedPreferences?.returnDate;
    const travelers   = result.extractedPreferences?.travelers || 1;
    const flightBudget       = result.extractedPreferences?.flightBudget || 0;
    const hotelBudgetPerNight = result.extractedPreferences?.hotelBudgetPerNight || 0;
    const hasSplitBudget = flightBudget > 0 || hotelBudgetPerNight > 0;

    // ── Time window filtering ──────────────────────────────────────────────────
    // Booking.com RapidAPI doesn't support departure time range params, so we
    // filter post-search. Extract hour windows from preferences if the AI
    // captured them (e.g. "7AM to 11AM departure").
    // Schema returns -1 as sentinel for "no preference" — normalise to null
    const raw_dtf = result.extractedPreferences?.departTimeFrom;
    const raw_dtt = result.extractedPreferences?.departTimeTo;
    const raw_rtf = result.extractedPreferences?.returnTimeFrom;
    const raw_rtt = result.extractedPreferences?.returnTimeTo;
    const departTimeFrom = (raw_dtf != null && raw_dtf >= 0) ? raw_dtf : null;
    const departTimeTo   = (raw_dtt != null && raw_dtt >= 0) ? raw_dtt : null;
    const returnTimeFrom = (raw_rtf != null && raw_rtf >= 0) ? raw_rtf : null;
    const returnTimeTo   = (raw_rtt != null && raw_rtt >= 0) ? raw_rtt : null;

    console.log('[TimeFilter] departWindow:', departTimeFrom, '-', departTimeTo,
                '| returnWindow:', returnTimeFrom, '-', returnTimeTo);

    function filterFlightsByTime(flights) {
      if (!flights?.length) return flights;
      let filtered = flights;

      if (departTimeFrom != null || departTimeTo != null) {
        const candidates = filtered.filter(f => {
          if (!f.departure_time) return true;
          const hour = new Date(f.departure_time).getHours();
          if (departTimeFrom != null && hour < departTimeFrom) return false;
          if (departTimeTo   != null && hour > departTimeTo)   return false;
          return true;
        });
        if (candidates.length > 0) {
          console.log('[TimeFilter] Outbound: ' + flights.length + ' → ' + candidates.length + ' after filter');
          filtered = candidates;
        } else {
          console.warn('[TimeFilter] No outbound flights matched time window — showing all');
        }
      }

      return filtered;
    }

    console.log('[BudgetCheck] readyToPlan:', result.readyToPlan,
                '| destinations:', result.plan?.destinations?.length,
                '| originCity:', originCity, '| departDate:', departDate,
                '| budgetAmount:', budgetAmount, '| flightBudget:', flightBudget, '| hotelBudgetPerNight:', hotelBudgetPerNight,
                '| existing flights from agentic path:', result.flights?.length || 0);

    if (result.readyToPlan && result.plan?.destinations?.length > 0 && originCity && departDate) {

      let cheapestFlightPrice = null;
      let cheapestHotelPrice  = null;

      if (result.flights && result.flights.length > 0) {
        cheapestFlightPrice = Math.min(...result.flights.map(f => f.price ?? Infinity));
      }
      if (result.hotels && result.hotels.length > 0) {
        cheapestHotelPrice = Math.min(...result.hotels.map(h => h.price ?? Infinity));
      }

      if (cheapestFlightPrice == null || cheapestHotelPrice == null) {
        console.log('[BudgetCheck] Missing flight or hotel data from agentic path — running deterministic search now.');
        const check = await deterministicBudgetCheck(
          result.plan, originCity, departDate, returnDate, travelers, hasSplitBudget ? 0 : (budgetAmount || 0)
        );
        console.log('[BudgetCheck] Deterministic search result:', check ? { cheapestTotal: check.cheapestTotal } : 'null (search failed — see error above)');

        if (check) {
          if (!result.flights || result.flights.length === 0) result.flights = check.flights;
          if (!result.hotels  || result.hotels.length === 0)  result.hotels  = check.hotels;
          cheapestFlightPrice = cheapestFlightPrice ?? (check.flights[0]?.price ?? null);
          cheapestHotelPrice  = cheapestHotelPrice  ?? (check.hotels[0]?.price ?? null);
        }
      }

      // Apply time window filter to all flights (works regardless of whether
      // they came from the agentic path or the deterministic fallback)
      if (result.flights?.length > 0) {
        result.flights = filterFlightsByTime(result.flights);
        // Recalculate cheapest after filtering
        if (result.flights.length > 0) {
          cheapestFlightPrice = Math.min(...result.flights.map(f => f.price ?? Infinity));
        }
      }

      // Number of nights, for per-night hotel budget comparison (hotel price
      // returned by Booking.com is the TOTAL for the whole stay, not per night).
      let nights = 1;
      if (departDate && returnDate) {
        const diff = Math.round((new Date(returnDate) - new Date(departDate)) / 86400000);
        nights = diff > 0 ? diff : 1;
      } else if (result.plan?.days) {
        nights = Math.max(1, result.plan.days - 1);
      }
      const cheapestHotelPerNight = cheapestHotelPrice != null ? cheapestHotelPrice / nights : null;

      console.log('[BudgetCheck] cheapestFlightPrice:', cheapestFlightPrice, '| cheapestHotelPrice:', cheapestHotelPrice, '| nights:', nights, '| perNight:', cheapestHotelPerNight);

      if (hasSplitBudget) {
        // ── Split budget path: compare flights and hotels SEPARATELY ──────────
        const flightIssues = [];
        if (flightBudget > 0 && cheapestFlightPrice != null) {
          if (cheapestFlightPrice > flightBudget) {
            flightIssues.push(`flights come to approximately $${cheapestFlightPrice.toFixed(0)}, above your $${flightBudget.toFixed(0)} flight budget`);
          }
        }
        if (hotelBudgetPerNight > 0 && cheapestHotelPerNight != null) {
          if (cheapestHotelPerNight > hotelBudgetPerNight) {
            flightIssues.push(`hotels come to approximately $${cheapestHotelPerNight.toFixed(0)}/night, above your $${hotelBudgetPerNight.toFixed(0)}/night hotel budget`);
          }
        }

        if (flightIssues.length > 0) {
          result.message += `\n\n⚠️ Heads up — ${flightIssues.join(' and ')}. Would you like to adjust either budget, or should I check different dates or options?`;
        } else if (cheapestFlightPrice != null && cheapestHotelPerNight != null) {
          result.message += `\n\n✅ Good news — the cheapest flights ($${cheapestFlightPrice.toFixed(0)}) and hotels ($${cheapestHotelPerNight.toFixed(0)}/night) both fit within your stated budgets.`;
        }
      } else {
        // ── Combined budget path (original behaviour) ─────────────────────────
        const cheapestTotal = (cheapestFlightPrice || 0) + (cheapestHotelPrice || 0);
        const fitsBudget = (budgetAmount || 0) > 0 && cheapestTotal > 0 ? cheapestTotal <= budgetAmount : null;

        console.log('[BudgetCheck] Final numbers — cheapestTotal:', cheapestTotal, '| budgetAmount:', budgetAmount, '| fitsBudget:', fitsBudget);

        if (fitsBudget === false) {
          result.message += `\n\n⚠️ Heads up — the cheapest flights and hotels I found for this trip come to approximately $${cheapestTotal.toFixed(0)}, which is above your stated budget of $${budgetAmount.toFixed(0)}. Would you like to increase your budget, or should I check different travel dates for cheaper fares?`;
        } else if (fitsBudget === true) {
          result.message += `\n\n✅ Good news — real flights and hotels for this trip come to approximately $${cheapestTotal.toFixed(0)}, which fits within your $${budgetAmount.toFixed(0)} budget.`;
        } else {
          console.log('[BudgetCheck] Could not determine budget fit — no usable price data found.');
        }
      }
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('[chatWithAI] Error:', err.message);
    return res.status(500).json({ error: 'Failed to process chat conversation.' });
  }
};


// ═══════════════════════════════════════════════════════════════════════════════
// BOOKING ENGINE — final reservation confirmation step
// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/trips/booking/confirm
//
// This does NOT call a real airline/hotel booking API — Booking.com's RapidAPI
// plan only supports SEARCH, not creating an actual reservation with them.
// Instead this creates a confirmed internal reservation record with a unique
// confirmation code, representing "the traveller has locked in this exact
// itinerary and pricing". Payment (Stripe) is the next step after this — once
// that lands, this record transitions from 'pending_payment' to 'confirmed'.
//
// Body:
// {
//   tripId?:              string,   // optional — link to a saved trip record
//   destination:          string,
//   originCity:           string,
//   departDate:           string,   // YYYY-MM-DD
//   returnDate:           string,   // YYYY-MM-DD
//   travelers:            number,
//   selectedComponents:   [{ source, componentType, title, pricePerPerson, provider }],
//   totalPricePerPerson:  number,
//   totalPriceAll:        number,
//   travelerName:         string,
//   travelerEmail:        string,
//   travelerPhone?:       string,
// }
const crypto = require('crypto');

function generateConfirmationCode() {
  // e.g. TRV-8F3K2A — short, human-readable, unique enough for a booking ref
  const random = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
  return `TRV-${random}`;
}

const confirmBooking = async (req, res) => {
  const { userId } = req.user;
  const {
    tripId,
    destination,
    originCity,
    departDate,
    returnDate,
    travelers,
    selectedComponents,
    totalPricePerPerson,
    totalPriceAll,
    travelerName,
    travelerEmail,
    travelerPhone,
  } = req.body;

  if (!destination || !originCity || !departDate) {
    return res.status(400).json({ error: 'destination, originCity, and departDate are required to confirm a booking.' });
  }
  if (!selectedComponents || !Array.isArray(selectedComponents) || selectedComponents.length === 0) {
    return res.status(400).json({ error: 'At least one selected flight, hotel, or activity is required to confirm a booking.' });
  }
  if (!travelerName || !travelerEmail) {
    return res.status(400).json({ error: 'travelerName and travelerEmail are required.' });
  }

  try {
    const confirmationCode = generateConfirmationCode();

    const result = await pool.query(
      `INSERT INTO bookings (
        user_id, trip_id, confirmation_code, status,
        destination, origin_city, depart_date, return_date, travelers,
        selected_components, total_price_per_person, total_price_all,
        traveler_name, traveler_email, traveler_phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id, confirmation_code, status, created_at`,
      [
        userId,
        tripId || null,
        confirmationCode,
        'pending_payment', // becomes 'confirmed' once Stripe payment succeeds (next feature)
        destination,
        originCity,
        departDate,
        returnDate || null,
        travelers || 1,
        JSON.stringify(selectedComponents),
        totalPricePerPerson || 0,
        totalPriceAll || 0,
        travelerName,
        travelerEmail,
        travelerPhone || null,
      ]
    );

    const bookingRow = result.rows[0];

    return res.status(201).json({
      success: true,
      booking: {
        id:               bookingRow.id,
        confirmationCode: bookingRow.confirmation_code,
        status:           bookingRow.status,
        createdAt:        bookingRow.created_at,
      },
      message: `Your itinerary is reserved! Confirmation code: ${bookingRow.confirmation_code}. Payment is required to finalise this booking.`,
    });
  } catch (err) {
    console.error('[confirmBooking] Error:', err.message);
    return res.status(500).json({ error: 'Failed to confirm booking. Please try again.' });
  }
};

// GET /api/trips/booking/:id — fetch a single booking (for a confirmation page)
const getBookingById = async (req, res) => {
  const { userId } = req.user;
  const bookingId = req.params.id;

  try {
    const result = await pool.query(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
      [bookingId, userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    return res.status(200).json({ booking: result.rows[0] });
  } catch (err) {
    console.error('[getBookingById] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch booking.' });
  }
};

// GET /api/trips/bookings — list all bookings for the logged-in user
const getUserBookings = async (req, res) => {
  const { userId } = req.user;
  try {
    const result = await pool.query(
      'SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return res.status(200).json({ bookings: result.rows });
  } catch (err) {
    console.error('[getUserBookings] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
};

module.exports = { planTrip, saveTrip, getUserTrips, getTripById, modifyTrip, deleteTrip, chatWithAI, confirmBooking, getBookingById, getUserBookings };




