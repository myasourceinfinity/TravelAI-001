/**
 * openaiHelper.js
 *
 * Wrapper around the OpenAI API for AI-powered trip planning.
 * Uses GPT-4o with structured JSON output (response_format) to ensure
 * reliable, parseable trip recommendations.
 *
 * Falls back gracefully if OPENAI_API_KEY is not configured.
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
          description: 'A 2-4 sentence narrative summary of the planned trip, written in first person as a travel agent.',
        },
        destinations: {
          type: 'array',
          description: 'The recommended destinations (3-5) in visit order.',
          items: {
            type: 'object',
            properties: {
              id:         { type: 'string', description: 'Unique slug ID, e.g. "tokyo" or "lake-como".' },
              name:       { type: 'string', description: 'City or area name.' },
              country:    { type: 'string', description: 'Country name.' },
              lat:        { type: 'number', description: 'Latitude coordinate.' },
              lng:        { type: 'number', description: 'Longitude coordinate.' },
              emoji:      { type: 'string', description: 'A single emoji representing this destination.' },
              highlights: {
                type: 'array',
                description: '3-5 must-see attractions or experiences.',
                items: { type: 'string' },
              },
            },
            required: ['id', 'name', 'country', 'lat', 'lng', 'emoji', 'highlights'],
            additionalProperties: false,
          },
        },
        suggestions: {
          type: 'array',
          description: '2-4 additional destinations the traveler might consider.',
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
        },
        startCity: {
          type: 'string',
          description: 'Recommended departure/return city based on the traveler description, or a sensible default.',
        },
        travelers: {
          type: 'number',
          description: 'Number of travelers detected from the description.',
        },
        days: {
          type: 'number',
          description: 'Number of days for the trip.',
        },
        budgetLevel: {
          type: 'string',
          description: 'One of: budget, moderate, luxury.',
        },
      },
      required: ['summary', 'destinations', 'suggestions', 'startCity', 'travelers', 'days', 'budgetLevel'],
      additionalProperties: false,
    },
  },
};

// ── System prompt ───────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are TravelAI, an expert AI travel planner. Given a traveler's trip description, generate a detailed trip recommendation.

Rules:
- Recommend 3-5 destinations that best match the traveler's preferences (locations, budget, interests, exclusions).
- Respect any exclusions explicitly mentioned (e.g. "no beaches" means skip beach destinations).
- Provide accurate latitude/longitude coordinates for each destination.
- Choose a relevant emoji for each destination (cultural landmark, nature, food, etc.).
- List 3-5 real, well-known highlights/attractions for each destination.
- Suggest 2-4 alternative destinations the traveler might also enjoy.
- Infer the number of travelers and trip duration from the description; default to 2 travelers and 7 days if not specified.
- Infer budget level (budget/moderate/luxury) from context.
- Pick a sensible start city based on the traveler's likely origin, or default to a major international hub.
- Write the summary as a friendly, knowledgeable travel agent in first person.`;

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

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from OpenAI.');
  }

  const plan = JSON.parse(content);

  // Ensure IDs are unique lowercase slugs
  plan.destinations = plan.destinations.map(d => ({
    ...d,
    id: d.id || d.name.toLowerCase().replace(/\s+/g, '-'),
  }));

  return plan;
}

module.exports = {
  isConfigured,
  generateTripPlan,
};
