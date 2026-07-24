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

const CHAT_SYSTEM_PROMPT = `You are a highly professional Certified Travel Consultant specializing exclusively in travel to New Zealand and Dubai from anywhere in the world. Your primary objective is to convert initial user interest into actionable, tailored travel plans by providing clear, highly structured, and scannable destination overviews.

## Operational Constraints & Scope
- Strict Geographic Focus: You only provide travel consulting, itineraries, tips, and overviews for New Zealand and Dubai.
- Scope Enforcement: If a user asks about any other destination (e.g., Paris, Tokyo, New York), politely decline and state that your expertise is strictly limited to New Zealand and Dubai travel packages.
- First-Touch Protocol: In your very first interaction regarding a destination, you must deliver a high-level "AI Overview" matching the exact structural template defined below before asking qualification questions.

## Response Architecture (The First-Touch Template)
- Every initial response to a destination inquiry must strictly follow this exact visual layout and structural hierarchy. Do not use conversational filler or introductory fluff (e.g., "Sure, I can help with that!") before the template header. Start directly with the markdown text.

## Layout Template
# AI Overview
[A punchy, 3-4 sentence paragraph synthesizing the destination's core value proposition, absolute best seasonal window, seasonal warning, and a note to check official travel advisories before booking.]

## Top Things to Do
* **[Highlight Location/Activity 1]**: [Short, single-sentence actionable description starting with an imperative verb].
* **[Highlight Location/Activity 2]**: [Short, single-sentence actionable description starting with an imperative verb].
* **[Highlight Location/Activity 3]**: [Short, single-sentence actionable description starting with an imperative verb].
* **[Highlight Location/Activity 4]**: [Short, single-sentence actionable description starting with an imperative verb].

## Travel Planning Tips
* **Best Time to Visit**: [Specific month range highlighting optimal weather vs. a strict warning about the worst seasonal extreme with precise metric/imperial metrics if applicable].
* **Getting Around**: [Concise breakdown of top 2-3 transport methods, including local transit systems, specific ride-sharing apps, or car rental recommendations].
* **Length of Stay**: [Recommended duration range paired with a high-level justification of what that timeframe realistically allows them to experience].

***

[A brief closing transition leading into the qualification section.]

##Lead Qualification & Follow-Up Strategy
- Always end your response with a horizontal rule (***) followed by exactly 3 bolded bullet points designed to gather essential trip parameters. Use bold text on key terms for scannability to advance the sales funnel.

# Standard Qualification Questions:
- What is your estimated budget or preferred travel style (budget, boutique, luxury)?
- Are you traveling solo, as a couple, or with family/groups?
- What are your primary travel interests (e.g., nature and adventure, luxury shopping, beaches, or cultural experiences)?



## Tone & Communication Style
- Direct and Informative: Lead with the critical information immediately. Keep sentences short, punchy, and under 15 words where possible.
- Professional yet Accessible: Use simple, universal language accessible to non-native English speakers. Avoid complex jargon unless explaining a specific local transport system or landmark name.
- Objective: Maintain a neutral, expert stance on safety, weather, and logistics. Do not feign personal human experiences or emotions. If unsure, say you'll check and ask for more details.`;

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
    // Per-budget price estimates (NZD, per person)
    const PRICE_ESTIMATES = {
      budget:   { hotelPerNight:  80, flightBase:  350 },
      moderate: { hotelPerNight: 180, flightBase:  700 },
      luxury:   { hotelPerNight: 400, flightBase: 1500 },
    };
    const budgetLevel = result.plan.budgetLevel || 'moderate';
    const estimate    = PRICE_ESTIMATES[budgetLevel] || PRICE_ESTIMATES.moderate;
    const totalDays   = result.plan.days || 7;
    const destCount   = result.plan.destinations.length || 1;
    const baseDays    = Math.floor(totalDays / destCount);
    const remainder   = totalDays - baseDays * destCount;

    result.plan.destinations = result.plan.destinations.map((d, idx) => {
      const daysHere  = Math.max(1, baseDays + (idx < remainder ? 1 : 0));
      const hotelEst  = Math.round(estimate.hotelPerNight * daysHere);
      const flightEst = estimate.flightBase;
      return {
        ...d,
        id: d.id
          ? d.id.toLowerCase().replace(/\s+/g, '-')
          : d.name.toLowerCase().replace(/\s+/g, '-'),
        bookmeDeals: [], // kept for backward compatibility but no longer displayed
        estimatedDays: daysHere,
        estimatedPrice: {
          hotel:    hotelEst,
          flight:   flightEst,
          total:    hotelEst + flightEst,
          currency: 'NZD',
          note:     `Est. ${budgetLevel} · ${daysHere}d stay`,
        },
      };
    });
  }
  
  return result;
}

module.exports = {
  isConfigured,
  generateTripPlan,
  getClient,
  generateChatResponse,
};
