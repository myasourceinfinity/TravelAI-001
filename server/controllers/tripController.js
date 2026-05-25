/**
 * tripController.js
 *
 * Handles AI trip planning:
 *  - planTrip: POST /api/trips/plan — accepts trip description, returns AI-generated plan
 *
 * Uses OpenAI GPT-4o with structured JSON output when OPENAI_API_KEY is set.
 * Falls back to a hardcoded mock plan when the key is not configured.
 */
const { isConfigured, generateTripPlan } = require('../utils/openaiHelper');
const { scrapeBookmeDeals } = require('../utils/bookmeScraper');
const pool = require('../config/db');

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
    "summary": "Get ready to explore the breathtaking landscapes of Kiwi Land (New Zealand) on a budget-friendly adventure. We'll start our journey in Auckland, experiencing its vibrant culture, before heading to the geothermal wonders of Rotorua. Then, it's off to the stunning natural beauty of Tongariro National Park and the relaxing beaches of Tauranga. Finally, we'll wrap up with a visit to the artistic and cultural hub of Wellington.",
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
  const { plan, title } = req.body;

  if (!plan || !plan.destinations) {
    return res.status(400).json({ error: 'Invalid trip plan data.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Insert the trip
    const tripQuery = `
      INSERT INTO trips (user_id, title, summary, start_city, travelers, days, budget_level, suggestions)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id;
    `;
    const tripValues = [
      userId,
      title || null,
      plan.summary,
      plan.startCity,
      plan.travelers || 1,
      plan.days || 1,
      plan.budgetLevel,
      JSON.stringify(plan.suggestions || [])
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

module.exports = { planTrip, saveTrip, getUserTrips };

