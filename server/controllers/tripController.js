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
      { id: 'tokyo',    name: 'Tokyo',    country: 'Japan', lat: 35.6762, lng: 139.6503, emoji: '⛩️', highlights: ['Senso-ji Temple', 'Shibuya Crossing', 'Meiji Shrine', 'Akihabara'] },
      { id: 'takayama', name: 'Takayama', country: 'Japan', lat: 36.1461, lng: 137.2522, emoji: '🏔️', highlights: ['Matsumoto Castle', 'Japanese Alps', 'Old Town streets'] },
      { id: 'hakone',   name: 'Hakone',   country: 'Japan', lat: 35.2326, lng: 139.1070, emoji: '♨️', highlights: ['Lake Ashi', 'Mt. Fuji views', 'Hot springs'] },
    ],
    europe: [
      { id: 'paris',     name: 'Paris',     country: 'France', lat: 48.8566, lng: 2.3522,  emoji: '🗼', highlights: ['Eiffel Tower', 'Louvre Museum', 'Montmartre'] },
      { id: 'rome',      name: 'Rome',      country: 'Italy',  lat: 41.9028, lng: 12.4964, emoji: '🏛️', highlights: ['Colosseum', 'Vatican City', 'Trevi Fountain'] },
      { id: 'barcelona', name: 'Barcelona', country: 'Spain',  lat: 41.3874, lng: 2.1686,  emoji: '🎭', highlights: ['Sagrada Familia', 'Park Güell', 'La Rambla'] },
    ],
    default: [
      { id: 'bali',   name: 'Bali',     country: 'Indonesia', lat: -8.3405,  lng: 115.0920, emoji: '🏝️', highlights: ['Ubud Rice Terraces', 'Tanah Lot Temple', 'Beaches'] },
      { id: 'nyc',    name: 'New York', country: 'USA',       lat: 40.7128,  lng: -74.0060, emoji: '🗽', highlights: ['Times Square', 'Central Park', 'Statue of Liberty'] },
      { id: 'sydney', name: 'Sydney',   country: 'Australia',  lat: -33.8688, lng: 151.2093, emoji: '🦘', highlights: ['Opera House', 'Harbour Bridge', 'Bondi Beach'] },
    ],
  };

  const travelerMatch = desc.match(/(\d+)\s*(person|people|traveler|travelers|pax)/);
  const dayMatch      = desc.match(/(\d+)\s*(day|days|night|nights)/);

  return {
    summary,
    destinations: MOCK[region],
    suggestions: [{ id: 'kyoto', name: 'Kyoto', country: 'Japan', emoji: '🏯' }],
    startCity: 'San Francisco',
    travelers: travelerMatch ? parseInt(travelerMatch[1], 10) : 2,
    days:      dayMatch ? parseInt(dayMatch[1], 10) : 7,
    budgetLevel: desc.includes('budget') ? 'budget' : 'moderate',
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
// PLAN TRIP  —  POST /api/trips/plan
// ═══════════════════════════════════════════════════════════════════════════════
const planTrip = async (req, res) => {
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
      plan   = await generateTripPlan(description.trim());
      source = 'ai';
      console.log(`[planTrip] AI plan generated for user ${userId}`);
    } else {
      // ── Mock fallback (no OPENAI_API_KEY) ────────────────────────────────
      plan   = generateMockPlan(description.trim());
      source = 'mock';
      console.warn('[planTrip] OPENAI_API_KEY not set — returning mock plan.');
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

module.exports = { planTrip };
