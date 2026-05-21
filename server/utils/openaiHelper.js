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

module.exports = {
  isConfigured,
  generateTripPlan,
};
