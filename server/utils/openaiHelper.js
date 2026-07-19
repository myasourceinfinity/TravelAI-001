/**
 * openaiHelper.js
 *
 * Wrapper around the OpenAI API for AI-powered trip planning.
 * Uses GPT-4o with structured JSON output (response_format: json_schema)
 * to ensure reliable, parseable trip recommendations.
 */

const OpenAI = require('openai');

// ── Initialize client (lazy — only when key is present) ─────────────────────
let _client = null;

function getClient() {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  _client = new OpenAI({ apiKey });
  return _client;
}

/** Check if OpenAI is configured */
function isConfigured() {
  return !!process.env.OPENAI_API_KEY;
}

// ── JSON Schema for the trip plan response ──────────────────────────────────
// NOTE: additionalProperties: false is required for strict mode.
// bookmeDeals is intentionally excluded here — it is injected AFTER the
// OpenAI call by the Bookme scraper in tripController.js. Do not add it
// to the schema or GPT-4o will attempt to hallucinate deal data.
const TRIP_PLAN_SCHEMA = {
  type: 'json_schema',
  json_schema: {
    name: 'trip_plan',
    strict: true,
    schema: {
      type: 'object',
      properties: {

        summary: {
          type: 'string',
          description:
            'A 2–4 sentence narrative overview of the trip written in first person as a friendly travel agent. Mention the key destinations and the overall vibe (budget, adventure, culture, etc.).',
        },

        destinations: {
          type: 'array',
          description: 'Recommended destinations in visit order. 3–5 destinations for trips up to 10 days; up to 6 for longer trips.',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Unique lowercase hyphenated slug, e.g. "auckland" or "tongariro-national-park".',
              },
              name:    { type: 'string', description: 'City, area, or park name.' },
              country: { type: 'string', description: 'Country name.' },
              lat:     { type: 'number', description: 'Accurate latitude in decimal degrees.' },
              lng:     { type: 'number', description: 'Accurate longitude in decimal degrees.' },
              emoji:   { type: 'string', description: 'One emoji representing this destination.' },
              highlights: {
                type: 'array',
                description: '3 must-see attractions or experiences at this destination.',
                items: { type: 'string' },
                minItems: 3,
                maxItems: 3,
              },
            },
            required: ['id', 'name', 'country', 'lat', 'lng', 'emoji', 'highlights'],
            additionalProperties: false,
          },
          minItems: 3,
          maxItems: 6,
        },

        suggestions: {
          type: 'array',
          description: '3 alternative destinations the traveller might consider adding or swapping in. Must not duplicate destinations already in the plan.',
          items: {
            type: 'object',
            properties: {
              id:      { type: 'string' },
              name:    { type: 'string' },
              country: { type: 'string' },
              emoji:   { type: 'string' },
            },
            required: ['id', 'name', 'country', 'emoji'],
            additionalProperties: false,
          },
          minItems: 3,
          maxItems: 3,
        },

        startCity: {
          type: 'string',
          description: 'The recommended arrival/departure city for this itinerary (typically the first destination).',
        },

        travelers: {
          type: 'number',
          description: 'Number of travelers. Parse from the description; default to 1 if not mentioned.',
        },

        days: {
          type: 'number',
          description: 'Total trip duration in days. Parse from the description; default to 7 if not mentioned.',
        },

        // FIX: was an open string — now an enum so GPT-4o cannot return arbitrary values
        budgetLevel: {
          type: 'string',
          enum: ['budget', 'moderate', 'luxury'],
          description: 'Infer from the description. Use "budget" for low-cost trips, "moderate" for mid-range, "luxury" for premium.',
        },

      },
      required: [
        'summary',
        'destinations',
        'suggestions',
        'startCity',
        'travelers',
        'days',
        'budgetLevel',
      ],
      additionalProperties: false,
    },
  },
};

// ── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are TravelAI, an expert AI travel planner acting as a backend API.
Your job is to process a traveller's trip request and return a highly personalised itinerary.

CRITICAL: Respond ONLY with a valid JSON object matching the schema provided.
No markdown, no backticks, no preamble, no explanation — raw JSON only.

PLANNING RULES:
1. Choose 3–5 destinations (up to 6 for trips over 10 days) in logical geographic order.
2. For budget trips: keep destinations regionally tight to minimise transport costs.
3. Provide exactly 3 highlights per destination — real, well-known attractions.
4. Use accurate lat/lng coordinates (decimal degrees). Never invent coordinates.
5. Every destination must have established hotel infrastructure (no remote wilderness camps).
6. Infer travelers, days, and budgetLevel from the description. Default: 1 traveler, 7 days, budget.
7. suggestions must be real destinations NOT already in the plan.
8. Write the summary in first person as a friendly travel agent — mention key places and the trip mood.`;

// ═══════════════════════════════════════════════════════════════════════════════
// generateTripPlan — call GPT-4o for a structured trip recommendation
// ═══════════════════════════════════════════════════════════════════════════════
async function generateTripPlan(description) {
  const client = getClient();
  if (!client) {
    throw new Error('OPENAI_NOT_CONFIGURED');
  }

  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.7,
    max_tokens: 2000,
    response_format: TRIP_PLAN_SCHEMA,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: description },
    ],
  });

  // Check for refusal (GPT-4o structured output can return a refusal object)
  const choice = completion.choices[0];
  if (choice.finish_reason === 'refusal') {
    throw new Error(`OpenAI refused the request: ${choice.message.refusal}`);
  }

  const content = choice.message?.content;
  if (!content) {
    throw new Error('Empty response from OpenAI.');
  }

  console.log('[generateTripPlan] Raw OpenAI response:', content);

  const plan = JSON.parse(content);

  // Sanitise: ensure all IDs are valid lowercase slugs (defensive, schema should enforce this)
  plan.destinations = plan.destinations.map(d => ({
    ...d,
    id: d.id
      ? d.id.toLowerCase().replace(/\s+/g, '-')
      : d.name.toLowerCase().replace(/\s+/g, '-'),
    bookmeDeals: [], // initialise empty — filled by scraper in tripController.js
  }));

  return plan;
}

const CHAT_RESPONSE_SCHEMA = {
  type: 'json_schema',
  json_schema: {
    name: 'chat_response',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'A friendly and conversational response from a travel consultant. Do not expose raw JSON. Welcome the user, ask clarifying questions to pull their interests/location preferences, budget level, destination, or duration. If they ask about trip info/itinerary, politely explain that you are tailoring it for them first.'
        },
        extractedPreferences: {
          type: 'object',
          description: 'Extract any known fields from the user messages. Use empty string for destination/budgetLevel, 0 for days/travelers, and empty array for location_types if not yet specified.',
          properties: {
            destination: { type: 'string' },
            originCity: {
              type: 'string',
              description: 'The city the traveller is flying FROM (their departure city). Empty string if not yet mentioned. This is MANDATORY before readyToPlan can be true — required for flight search.'
            },
            days: { type: 'number' },
            travelers: { type: 'number' },
            budgetLevel: { type: 'string' },
            departDate: {
              type: 'string',
              description: 'Trip departure date in YYYY-MM-DD format if the traveller has given one (even approximately, e.g. "mid September" should be resolved to a specific date in the current or next occurrence). Empty string if not yet known.'
            },
            returnDate: {
              type: 'string',
              description: 'Trip return date in YYYY-MM-DD format if known or derivable from days + departDate. Empty string if not yet known.'
            },
            location_types: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['destination', 'originCity', 'days', 'travelers', 'budgetLevel', 'departDate', 'returnDate', 'location_types'],
          additionalProperties: false
        },
        readyToPlan: {
          type: 'boolean',
          description: 'Set to true ONLY when ALL of the following are known: destination, originCity (departure city — mandatory, flights cannot be searched without it), duration (days) or explicit dates, number of travelers, and budget level. If originCity is missing, you MUST ask for it explicitly before setting this true — never assume or default it.'
        },
        plan: {
          type: 'object',
          description: 'Only generate a real plan when readyToPlan is true. Otherwise, return default empty/placeholder values.',
          properties: {
            summary: { type: 'string' },
            destinations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  country: { type: 'string' },
                  lat: { type: 'number' },
                  lng: { type: 'number' },
                  emoji: { type: 'string' },
                  highlights: { type: 'array', items: { type: 'string' } }
                },
                required: ['id', 'name', 'country', 'lat', 'lng', 'emoji', 'highlights'],
                additionalProperties: false
              }
            },
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  country: { type: 'string' },
                  emoji: { type: 'string' }
                },
                required: ['id', 'name', 'country', 'emoji'],
                additionalProperties: false
              }
            },
            startCity: { type: 'string' },
            travelers: { type: 'number' },
            days: { type: 'number' },
            budgetLevel: { type: 'string' }
          },
          required: ['summary', 'destinations', 'suggestions', 'startCity', 'travelers', 'days', 'budgetLevel'],
          additionalProperties: false
        }
      },
      required: ['message', 'extractedPreferences', 'readyToPlan', 'plan'],
      additionalProperties: false
    }
  }
};

const CHAT_SYSTEM_PROMPT = `You are a certified travel consultant working for New Zealand and Dubai travel agencies. You only provide services for travel to New Zealand and Dubai from anywhere in the world.

## Scope
- All travel planning, itineraries, quotes, and advice must be for New Zealand or Dubai only.
- If the customer asks about another country/region, politely redirect them to NZ or Dubai travel.

## Core Knowledge (internal)
**Visa & Entry**
- New Zealand: Visitor Visa (typically 9 months or less; must show funds, onward ticket, and health/character requirements); NZeTA (required for visa waiver travelers before travel); Working Holiday Visa (for eligible ages/countries); Transit Visa (when applicable); strict agricultural/biosecurity quarantine rules.
- Dubai (UAE): Visa on Arrival (for eligible nationalities) and standard pre-arranged Tourist Visas; strict minimum 6-month passport validity rule; smart gate entry availability.

**Popular Itineraries**
- New Zealand North Island: Auckland, Hamilton, Taupo, Rotorua, Waitomo Caves, Wellington.
- New Zealand South Island: Christchurch, Queenstown, Dunedin, Wanaka, Milford Sound, Franz Josef / Fox Glaciers, Tekapo.
- Dubai City: Downtown Dubai (Burj Khalifa, Dubai Mall, Fountains), Palm Jumeirah, Dubai Marina.
- Old Dubai & Beyond: Deira, Gold & Spice Souks, Dubai Creek Abras, Desert Safaris, and optional day trips to Abu Dhabi (Sheikh Zayed Grand Mosque).
- Classic mixes: 10–21 days for NZ (self-drive vs. escorted), 3–7 days for Dubai (luxury stopovers vs. deep exploration), family vs. adventure.

**Transport**
- New Zealand: Domestic flights (Air NZ, Jetstar); Car/Campervan rental (one-way fees, age restrictions, freedom camping rules); Coach tours (InterCity, GreatSights); Public transport basics in major cities.
- Dubai: Dubai Metro and Nol cards for public transit; Ride-hailing (Careem, Uber) and RTA Taxis; Hub connections via Emirates and Flydubai.

**Accommodation & Tours**
- New Zealand: Hotels, lodges, motels, holiday parks; Adventure (bungy, skydive, jet boat); Wildlife (whale watching, penguins, kiwi sanctuaries); Maori cultural experiences.
- Dubai: Ultra-luxury resorts, city-center high-rises, desert conservation reserves (e.g., Al Maha); Theme parks (Aquaventure, IMG); Luxury shopping festivals and observation decks.

**Planning and Culture**
- Seasonality: NZ's seasons are opposite to the Northern Hemisphere (best times by region/activity). Dubai experiences extreme summer heat (June–September); peak travel is during the cooler winter months. 
Budget levels: Budget, mid-range, luxury.
- Dubai Cultural Nuances: Advise on modest dress codes in public spaces, public affection rules, Ramadan travel considerations (dining hours, cultural respect), and hotel-based alcohol licensing rules.
- General: Accessibility, dietary needs, family travel, insurance, and cancellation advice.


## Required Behavior
1. Greet like a professional consultant and ask short discovery questions ONE-BY-ONE.
2. Clarify the traveler profile: destination choice (NZ or Dubai), group size, dates (duration), departure city, interests, and budget level.
3. Provide structured recommendations with rationale and suggest interesting facts or things to do at potential destinations.
4. DO NOT give trip itineraries or destinations list directly to the user at the start. Build it interactively.
5. MANDATORY FIELDS before readyToPlan can be true — ALL of these must be known:
   - destination (NZ or Dubai)
   - originCity — the city the traveller is flying FROM. This is REQUIRED for flight search and must NEVER be skipped, assumed, or defaulted. If the traveller has not stated where they are flying from, you MUST explicitly ask them (e.g. "Which city will you be flying from?") before proceeding. Do not set readyToPlan to true until this is answered.
   - duration (days) or explicit departure/return dates
   - number of travelers
   - budget level
   If ANY of these are missing, set readyToPlan to false and ask for the missing field(s) directly and conversationally — one or two at a time, not all at once.
6. Dates: if the traveller gives a date without a year (e.g. "10 September" or "next month"), resolve it to the next future occurrence of that date. Never assume a past year. Populate departDate and returnDate in YYYY-MM-DD format once known or derivable.
7. In extractedPreferences: update the fields as soon as you find them in user messages. Location types should be a clean array of interests (e.g., ["Beach", "Adventure", "History", "Food", "Luxury"]).


## Tone
- Friendly, clear, accurate.
- Use simple English; translate complex terms when needed.
- Avoid jargon; never provide unsafe travel or culturally insensitive advice.
- If unsure, say you'll check and ask for more details.`;

async function generateChatResponse(messages) {
  const client = getClient();
  if (!client) {
    throw new Error('OPENAI_NOT_CONFIGURED');
  }

  // Inject today's real date so the model never resolves relative dates
  // ("next month", "10 September") against a stale training-data year.
  const todayStr = new Date().toISOString().split('T')[0];
  const dateAwareSystemPrompt = CHAT_SYSTEM_PROMPT + `\n\n## Today's date\nToday's real date is ${todayStr}. Always use this as the reference point for "today", "tomorrow", "next month", etc. Never assume a year from your training data when the traveller doesn't state one explicitly — if they say a date like "10 September" without a year, assume the NEXT occurrence of that date on or after ${todayStr}, not a past year.`;

  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.7,
    max_tokens: 2000,
    response_format: CHAT_RESPONSE_SCHEMA,
    messages: [
      { role: 'system', content: dateAwareSystemPrompt },
      ...messages,
    ],
  });

  const choice = completion.choices[0];
  if (choice.finish_reason === 'refusal') {
    throw new Error(`OpenAI refused the request: ${choice.message.refusal}`);
  }

  const content = choice.message?.content;
  if (!content) {
    throw new Error('Empty response from OpenAI.');
  }

  console.log('[generateChatResponse] Raw OpenAI response:', content);
  const result = JSON.parse(content);
  
  if (result.readyToPlan && result.plan && result.plan.destinations) {
    result.plan.destinations = result.plan.destinations.map(d => ({
      ...d,
      id: d.id
        ? d.id.toLowerCase().replace(/\s+/g, '-')
        : d.name.toLowerCase().replace(/\s+/g, '-'),
      bookmeDeals: [],
    }));
  }
  
  return result;
}

module.exports = {
  isConfigured,
  generateTripPlan,
  getClient,
  generateChatResponse,
};
