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
            budgetLevel: {
              type: 'string',
              description: 'A category label for narrative use: "budget", "moderate", or "luxury". This is descriptive text only — the exact numeric figure the traveller stated belongs in budgetAmount, never here.'
            },
            budgetAmount: {
              type: 'number',
              description: 'The overall trip budget in one combined number, if the traveller gave one single figure for the whole trip (e.g. "$5000 total"). Use 0 if they instead gave SEPARATE figures for flights and hotels — in that case use flightBudget and hotelBudgetPerNight instead, and leave this at 0.'
            },
            flightBudget: {
              type: 'number',
              description: 'If the traveller stated a SEPARATE budget specifically for flights (e.g. "budget is 500 NZD for flights"), put that exact number here. This is the total flight budget for all travelers combined, not per person. Use 0 if not separately specified.'
            },
            hotelBudgetPerNight: {
              type: 'number',
              description: 'If the traveller stated a SEPARATE budget specifically for hotels PER NIGHT (e.g. "200 NZD per night for hotels"), put that exact number here. This is per night, not total for the stay. Use 0 if not separately specified.'
            },
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
            },
            departTimeFrom: {
              type: 'number',
              description: 'Earliest acceptable departure hour (0-23, 24h) for the OUTBOUND flight. E.g. "between 7AM and 11AM" → 7. Use -1 if no preference stated.'
            },
            departTimeTo: {
              type: 'number',
              description: 'Latest acceptable departure hour (0-23, 24h) for the OUTBOUND flight. E.g. "between 7AM and 11AM" → 11. Use -1 if no preference stated.'
            },
            returnTimeFrom: {
              type: 'number',
              description: 'Earliest acceptable departure hour (0-23, 24h) for the RETURN flight. E.g. "between 5PM and 9PM" → 17. Use -1 if no preference stated.'
            },
            returnTimeTo: {
              type: 'number',
              description: 'Latest acceptable departure hour (0-23, 24h) for the RETURN flight. E.g. "between 5PM and 9PM" → 21. Use -1 if no preference stated.'
            }
          },
          required: ['destination', 'originCity', 'days', 'travelers', 'budgetLevel', 'budgetAmount', 'flightBudget', 'hotelBudgetPerNight', 'departDate', 'returnDate', 'location_types', 'departTimeFrom', 'departTimeTo', 'returnTimeFrom', 'returnTimeTo'],
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
                  emoji: {
                    type: 'string',
                    description: 'ONE emoji that captures the character or a signature landmark/activity of this specific destination (e.g. 🌋 for a geothermal area, 🏔️ for mountains, 🏖️ for a beach town). NEVER use a country flag emoji (e.g. 🇳🇿, 🇦🇪) — flags represent the whole country, not what makes this specific place distinctive.'
                  },
                  highlights: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Real tourist attractions, activities, landmarks, or points of interest at this destination (e.g. "Geothermal parks", "Maori cultural experiences", "Lake Rotorua", "Skyline Gondola"). This is a NEVER a place to list hotel names, accommodation options, flight details, or anything related to booking/logistics — those belong in the separate flights/hotels search results, not here. If you find yourself about to write a hotel or property name into highlights, that is a signal you have the wrong field — use general attraction categories or named landmarks instead.'
                  }
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
                  emoji: {
                    type: 'string',
                    description: 'ONE emoji representing this specific attraction/activity — never a country flag.'
                  }
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
   - SOME form of budget information — this is satisfied by ANY ONE of the following, they are equally valid and you must NOT wait for one specifically if another is already given: (a) budgetAmount > 0 (one combined figure), OR (b) flightBudget > 0 and/or hotelBudgetPerNight > 0 (split figures), OR (c) a budgetLevel category word like "budget"/"moderate"/"luxury" if the traveller only gave a vague description with no number at all. If the traveller already gave split flightBudget/hotelBudgetPerNight figures, budget is considered KNOWN — do not keep readyToPlan false waiting for a budgetAmount that will never come.
   If ANY of these are missing, set readyToPlan to false and ask for the missing field(s) directly and conversationally — one or two at a time, not all at once.
6. Dates: if the traveller gives a date without a year (e.g. "10 September" or "next month"), resolve it to the next future occurrence of that date. Never assume a past year. Populate departDate and returnDate in YYYY-MM-DD format once known or derivable.
6b. Traveler count: phrases like "travelling alone", "just me", "solo trip", "by myself" mean travelers = 1. Always parse these as an explicit traveler count, never leave travelers at 0 when the traveller has clearly indicated they are going alone or stated a number.
7. In extractedPreferences: update the fields as soon as you find them in user messages. Location types should be a clean array of interests (e.g., ["Beach", "Adventure", "History", "Food", "Luxury"]).
8. BUDGET NUMBER PRESERVATION: whenever the traveller states or updates a specific dollar figure (e.g. "$5000", "budget is 10000", "increase it to 10000"), you MUST put that exact number in budgetAmount — never only record it as a category word like "luxury" and lose the number. budgetLevel is separate descriptive text for narrative tone only; budgetAmount is the number booking/pricing logic depends on and must always reflect the traveller's most recently stated figure.
8. FLIGHT TIME PREFERENCES: if the traveller specifies preferred departure times (e.g. "between 7AM and 11AM", "morning flight", "afternoon return"), extract the hour range in 24h format:
   - "7AM to 11AM" → departTimeFrom: 7, departTimeTo: 11
   - "5PM to 9PM return" → returnTimeFrom: 17, returnTimeTo: 21
   - "morning flight" → departTimeFrom: 6, departTimeTo: 12
   - "afternoon departure" → departTimeFrom: 12, departTimeTo: 17
   - "evening return" → returnTimeFrom: 17, returnTimeTo: 22
   Use -1 for any time field the traveller has not specified.

9. SPLIT BUDGETS: if the traveller gives SEPARATE figures for flights and hotels (e.g. "budget is 500 NZD for flights and 200 NZD per night for hotels"), do NOT try to merge these into a single budgetAmount — instead populate flightBudget (total flight cost) and hotelBudgetPerNight (per night, not total stay) separately, and leave budgetAmount at 0. Only use budgetAmount when the traveller gives one single combined figure for the whole trip. Never guess or average split figures into one number.


## Tone
- Friendly, clear, accurate.
- Use simple English; translate complex terms when needed.
- Avoid jargon; never provide unsafe travel or culturally insensitive advice.
- If unsure, say you'll check and ask for more details.`;

// generateChatResponse was REMOVED — replaced entirely by
// generateAgenticChatResponse below. If you ever see a log line containing
// "[generateChatResponse]" after this change, it is IMPOSSIBLE for it to come
// from this file — it means Node is executing a different copy of this
// project entirely (duplicate folder, wrong start script path, etc.).

// ═══════════════════════════════════════════════════════════════════════════════
// AGENTIC CHAT — GPT-4o decides for itself when to search real flights/hotels
// ═══════════════════════════════════════════════════════════════════════════════
// Unlike generateChatResponse (which returns a static JSON plan and leaves the
// frontend to decide when to call bookingController separately), this gives
// the model actual tool definitions and lets it call search_flights /
// search_hotels mid-conversation, the same way travel-api.py does with
// OpenAI function-calling. The model chooses WHEN to search based on the
// conversation, not a keyword match on the frontend.

const booking = require('../services/bookingService');

const AGENT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_flight_location',
      description: 'Resolve a city or airport name to location ids usable for flight search. Always call this for BOTH the origin and destination city before calling search_flights.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: "City or airport name, e.g. 'Auckland'" } },
        required: ['query'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_flights',
      description: 'Search real flights between two RESOLVED location ids (from search_flight_location). Only call once origin, destination, and dates are all known. Booking.com only returns its top-ranked "best" offers by default — if the traveller asks for a SPECIFIC airline, pass preferred_airline so the results are filtered for it and you fetch a wider pool to increase the chance of finding that carrier.',
      parameters: {
        type: 'object',
        properties: {
          from_id:          { type: 'string', description: 'Origin location id from search_flight_location' },
          to_id:            { type: 'string', description: 'Destination location id from search_flight_location' },
          depart_date:      { type: 'string', description: 'YYYY-MM-DD' },
          return_date:      { type: 'string', description: 'YYYY-MM-DD — omit or empty string for one-way' },
          adults:           { type: 'number', description: 'Number of adult passengers' },
          cabin_class:      { type: 'string', description: 'ECONOMY, PREMIUM_ECONOMY, BUSINESS, or FIRST' },
          preferred_airline: { type: 'string', description: 'If the traveller asked for a specific airline (e.g. "Air New Zealand"), pass its name here to filter results to that carrier only. Leave empty to see all available options.' },
        },
        required: ['from_id', 'to_id', 'depart_date'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_hotel_destination',
      description: 'Resolve a city or place name to a hotel destination id and search_type. Call this before search_hotels.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: "City or place name, e.g. 'Dubai'" } },
        required: ['query'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_hotels',
      description: 'Search real hotels at a RESOLVED destination (from search_hotel_destination). Only call once the destination and travel dates are known.',
      parameters: {
        type: 'object',
        properties: {
          dest_id:         { type: 'string', description: 'Destination id from search_hotel_destination' },
          search_type:     { type: 'string', description: "The search_type value from search_hotel_destination, e.g. 'city' or 'district'" },
          arrival_date:    { type: 'string', description: 'YYYY-MM-DD check-in date' },
          departure_date:  { type: 'string', description: 'YYYY-MM-DD check-out date' },
          adults:          { type: 'number', description: 'Number of adult guests' },
          room_qty:        { type: 'number', description: 'Number of rooms, default 1' },
        },
        required: ['dest_id', 'search_type', 'arrival_date', 'departure_date'],
        additionalProperties: false,
      },
    },
  },
];

async function executeAgentTool(name, args) {
  console.log(`[executeAgentTool] Model called: ${name}(${JSON.stringify(args)})`);
  try {
    switch (name) {
      case 'search_flight_location': {
        const locations = await booking.searchFlightLocation(args.query);
        return { locations: locations.slice(0, 5) };
      }
      case 'search_flights': {
        const raw = await booking.searchFlights({
          from_id:     args.from_id,
          to_id:       args.to_id,
          depart_date: args.depart_date,
          return_date: args.return_date || null,
          adults:      args.adults || 1,
          cabin_class: args.cabin_class || 'ECONOMY',
        });

        // Fetch a wider pool when filtering by a specific airline — the
        // default top-5 "BEST" results may not include the traveller's
        // requested carrier even if it exists further down the list.
        const wideList = booking.summarizeFlights(raw, args.preferred_airline ? 20 : 5);

        if (args.preferred_airline && args.preferred_airline.trim()) {
          const needle = args.preferred_airline.trim().toLowerCase();
          const filtered = wideList.filter(f => (f.airline || '').toLowerCase().includes(needle));
          return {
            flights: filtered.slice(0, 5),
            requestedAirline: args.preferred_airline,
            airlineFound: filtered.length > 0,
            note: filtered.length === 0
              ? `No ${args.preferred_airline} flights were found in the available results for this route/date — this may mean they don't operate it, or simply weren't in the top results returned. Other airlines are available.`
              : undefined,
          };
        }

        return { flights: wideList.slice(0, 5) };
      }
      case 'search_hotel_destination': {
        const destinations = await booking.searchHotelDestination(args.query);
        return { destinations: destinations.slice(0, 5) };
      }
      case 'search_hotels': {
        const raw = await booking.searchHotels({
          dest_id:        args.dest_id,
          search_type:    args.search_type,
          arrival_date:   args.arrival_date,
          departure_date: args.departure_date,
          adults:         args.adults || 1,
          room_qty:       args.room_qty || 1,
        });
        const hotels = booking.summarizeHotels(raw, 5);
        return { hotels };
      }
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    console.error(`[executeAgentTool] ${name} failed:`, err.message);
    return { error: err.message };
  }
}

// Extra instructions appended only for the agentic path — explains tool
// availability and formatting rules so the model doesn't re-narrate card data
// as text once the frontend renders it as flight/hotel cards.
const AGENT_TOOL_INSTRUCTIONS = `

## Live search tools
You have real tools to search live flights and hotels: search_flight_location, search_flights, search_hotel_destination, search_hotels.
- Only call these AFTER destination, originCity, dates, travelers, and budget are all known (i.e. once you would otherwise set readyToPlan to true).
- Always resolve location names to ids first via search_flight_location / search_hotel_destination — never guess an id.
- If the traveller asks for a SPECIFIC airline (e.g. "only Air New Zealand flights"), pass preferred_airline to search_flights so a wider result pool is checked for that carrier. If none are found, say so honestly (e.g. "I couldn't find Air New Zealand flights for these dates — here's what else is available") — never invent or assume a specific airline's flights exist.
- Once the traveller confirms they're happy with the itinerary (e.g. "looks good", "yes please", "go ahead"), proactively call the flight and hotel search tools yourself for the destination(s) in the plan — do not wait to be asked again.
- If a tool call fails or returns nothing useful, say so plainly rather than inventing flight or hotel details.

CRITICAL FORMATTING RULE: when search_flights or search_hotels returns results, the customer will see them rendered as visual cards with prices, times, names, and ratings — do NOT list them again in your text reply. Your reply in that case should be ONE short sentence, e.g. "Here are some flight and hotel options for your trip." Nothing more.

CRITICAL BUDGET-CONSISTENCY RULE: never claim an itinerary "fits your budget" or is "within budget" based on your own general knowledge of typical prices — only the ACTUAL tool results determine this. After search_flights and/or search_hotels return, check the real prices against the traveller's stated budgetAmount:
- If the returned flight and/or hotel prices, combined, clearly exceed budgetAmount, you MUST say so plainly in your reply (e.g. "The flights alone come to $5,727, which is above your $5,000 budget — would you like to increase your budget, or should I check nearby dates for cheaper fares?"). Do NOT simultaneously claim the trip "stays within your budget of $X" when the tool results show otherwise — this is a contradiction the traveller will notice immediately and it damages trust.
- If you have not yet called the search tools for this destination, do not make any budget-fit claim at all — simply say the itinerary is ready and that you'll check live prices, or ask if they'd like you to search now.
- Never state a budget-fit conclusion that contradicts what your own tool calls returned in the same turn.`;

async function generateAgenticChatResponse(messages, maxRounds = 10) {
  const client = getClient();
  if (!client) {
    throw new Error('OPENAI_NOT_CONFIGURED');
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const systemPrompt = CHAT_SYSTEM_PROMPT
    + `\n\n## Today's date\nToday's real date is ${todayStr}. Always use this as the reference point for "today", "tomorrow", "next month", etc. Never assume a year from your training data when the traveller doesn't state one explicitly — if they say a date like "10 September" without a year, assume the NEXT occurrence of that date on or after ${todayStr}, not a past year.`
    + AGENT_TOOL_INSTRUCTIONS;

  const convo = [{ role: 'system', content: systemPrompt }, ...messages];

  let lastFlights = null;
  let lastHotels  = null;

  for (let round = 0; round < maxRounds; round++) {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 2000,
      tools: AGENT_TOOLS,
      tool_choice: 'auto',
      parallel_tool_calls: false, // required alongside strict structured output
      response_format: CHAT_RESPONSE_SCHEMA,
      messages: convo,
    });

    const choice = completion.choices[0];
    const msg = choice.message;

    if (choice.finish_reason === 'refusal') {
      throw new Error(`OpenAI refused the request: ${msg.refusal}`);
    }

    // ── Model wants to call a tool ──────────────────────────────────────────
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      convo.push({
        role: 'assistant',
        content: msg.content || '',
        tool_calls: msg.tool_calls.map(tc => ({
          id: tc.id,
          type: 'function',
          function: { name: tc.function.name, arguments: tc.function.arguments },
        })),
      });

      for (const tc of msg.tool_calls) {
        let args = {};
        try { args = JSON.parse(tc.function.arguments); } catch (_) {}
        const result = await executeAgentTool(tc.function.name, args);

        if (result.flights) lastFlights = result.flights;
        if (result.hotels)  lastHotels  = result.hotels;

        convo.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }

      continue; // let the model see tool results and respond again
    }

    // ── Model gave its final structured answer ──────────────────────────────
    const content = msg.content;
    if (!content) throw new Error('Empty response from OpenAI.');

    console.log('[generateAgenticChatResponse] Raw OpenAI response:', content);
    const result = JSON.parse(content);

    if (result.readyToPlan && result.plan && result.plan.destinations) {
      result.plan.destinations = result.plan.destinations.map(d => ({
        ...d,
        id: d.id ? d.id.toLowerCase().replace(/\s+/g, '-') : d.name.toLowerCase().replace(/\s+/g, '-'),
        bookmeDeals: [],
      }));
    }

    return { ...result, flights: lastFlights, hotels: lastHotels };
  }

  // Ran out of tool rounds — force a final plain-text answer, no more tools.
  const fallback = await client.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.7,
    max_tokens: 2000,
    response_format: CHAT_RESPONSE_SCHEMA,
    messages: convo,
  });
  const result = JSON.parse(fallback.choices[0].message.content);
  return { ...result, flights: lastFlights, hotels: lastHotels };
}

module.exports = {
  isConfigured,
  generateTripPlan,
  getClient,
  generateAgenticChatResponse,
};
