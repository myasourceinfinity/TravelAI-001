const pool = require('../config/db');

const MAX_RECENT_SEARCHES = 5;
const FEATURED_DUBAI_ATTRACTIONS = [
  { name: 'Burj Khalifa', subtitle: 'Skyline views · Downtown Dubai', slug: 'burj-khalifa' },
  { name: 'Dubai Mall', subtitle: 'Shopping, dining & entertainment', slug: 'dubai-mall' },
  { name: 'Palm Jumeirah', subtitle: 'Beaches, resorts & sea views', slug: 'palm-jumeirah' },
  { name: 'Dubai Frame', subtitle: 'Old and new Dubai panoramas', slug: 'dubai-frame' },
];

async function getRecentSearches(req, res) {
  const { userId } = req.user;

  try {
    const result = await pool.query(
      `
      SELECT 
        id,
        query,
        destination AS "destination",
        origin_city AS "originCity",
        duration_days AS "durationDays",
        travelers,
        budget_amount AS "budgetAmount",
        budget_level AS "budgetLevel",
        depart_date AS "departDate",
        return_date AS "returnDate",
        interests,
        response_summary AS "responseSummary",
        ai_response AS "aiResponse",
        analysis,
        completed_at AS "completedAt",
        created_at AS "createdAt"
      FROM recent_searches
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
      `,
      [userId, MAX_RECENT_SEARCHES]
    );

    return res.status(200).json({
      recentSearches: result.rows,
    });
  } catch (err) {
    console.error('[getRecentSearches] Error:', err);
    return res.status(500).json({ error: 'Failed to load recent searches.' });
  }
}

async function getPopularDestinations(_req, res) {
  try {
    const result = await pool.query(
      `
      SELECT
        MIN(destination) AS name,
        COUNT(*)::INTEGER AS "searchCount"
      FROM recent_searches
      WHERE destination IS NOT NULL
        AND BTRIM(destination) <> ''
        AND completed_at IS NOT NULL
      GROUP BY LOWER(BTRIM(destination))
      ORDER BY COUNT(*) DESC, MAX(completed_at) DESC
      LIMIT 8
      `
    );

    const popularDestinations = result.rows.length > 0
      ? result.rows.map((destination) => ({ ...destination, isFeatured: false }))
      : FEATURED_DUBAI_ATTRACTIONS.map((destination) => ({
        ...destination,
        searchCount: 0,
        isFeatured: true,
      }));

    return res.status(200).json({ popularDestinations });
  } catch (err) {
    console.error('[getPopularDestinations] Error:', err);
    return res.status(500).json({ error: 'Failed to load popular destinations.' });
  }
}

/**
 * GET /recent-searches/my-attractions
 * Returns individual AI-highlight cards (real tourist attractions / landmarks)
 * extracted from the logged-in user's saved trip plans.
 *
 * Each AI destination carries a `highlights` array of strings like:
 *   ["Senso-ji Temple", "Shibuya Crossing", "Meiji Shrine"]
 * We flatten those into individual carousel cards, using the destination city
 * name as the subtitle. Falls back to curated Dubai attractions when no plans exist.
 */
async function getMyAttractions(req, res) {
  const { userId } = req.user;

  try {
    const result = await pool.query(
      `SELECT analysis, destination, created_at
       FROM recent_searches
       WHERE user_id = $1
         AND analysis IS NOT NULL
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    const seen = new Set();
    const attractions = [];

    for (const row of result.rows) {
      let parsed;
      try {
        parsed = typeof row.analysis === 'string' ? JSON.parse(row.analysis) : row.analysis;
      } catch {
        continue;
      }

      // Support both { destinations: [...] } and { plan: { destinations: [...] } }
      const destinations = Array.isArray(parsed?.destinations)
        ? parsed.destinations
        : Array.isArray(parsed?.plan?.destinations)
        ? parsed.plan.destinations
        : [];

      for (const dest of destinations) {
        const cityName = (dest?.name || dest?.destination || row.destination || '').trim();

        // Flatten each highlight string into its own card
        const hlList = Array.isArray(dest?.highlights) ? dest.highlights : [];

        for (const hl of hlList) {
          const name = String(hl || '').trim();
          if (!name || seen.has(name.toLowerCase())) continue;
          seen.add(name.toLowerCase());
          attractions.push({
            name,
            subtitle: cityName ? `In ${cityName}` : 'From your trip plan',
            searchCount: 1,
            isFeatured: false,
          });
          if (attractions.length >= 12) break;
        }

        if (attractions.length >= 12) break;
      }

      if (attractions.length >= 12) break;
    }

    // Fall back to curated Dubai attractions when the user has no saved plans yet
    const popularDestinations = attractions.length > 0
      ? attractions
      : FEATURED_DUBAI_ATTRACTIONS.map(d => ({ ...d, searchCount: 0, isFeatured: true }));

    return res.status(200).json({ popularDestinations });
  } catch (err) {
    console.error('[getMyAttractions] Error:', err);
    return res.status(500).json({ error: 'Failed to load attractions.' });
  }
}

/**
 * Strips common travel-intent phrases from a raw user query and returns
 * a clean destination name (city / country / attraction / place).
 * e.g.  "i wanna travel to queenstown" => "Queenstown"
 *       "plan a 7-day trip to Dubai" => "Dubai"
 *       "auckland , 7 days, 2 people" => "Auckland"
 */
function extractDestinationFromQuery(query) {
  let s = query.trim();

  // Remove leading travel-intent phrases
  const intentPrefixes = [
    /^(i\s+)?(want|wanna|would like|like)\s+(to\s+)?(go|travel|visit|explore|plan|take a trip|fly|head)\s+(to\s+)?/i,
    /^(plan\s+)?(me\s+)?a\s+(trip|travel|holiday|vacation|journey)(\s+to)?\s*/i,
    /^(let'?s\s+)?(go|travel|visit|explore)\s+(to\s+)?/i,
    /^(take me to|show me|book me a trip to|book a trip to|how about)\s+/i,
    /^(i am|i'm|we are|we're)\s+(going|travelling|traveling|flying)\s+to\s+/i,
  ];
  for (const re of intentPrefixes) {
    s = s.replace(re, '');
  }

  // Grab everything up to the first comma, period, or qualifier
  // e.g. "Queenstown." or "Auckland , 7 days, 2 people" => "Auckland"
  const stopMatch = s.match(/^([^,\.!?\d]+?)(?:\s*[,\.!?]|\s+\d|$)/i);
  if (stopMatch) {
    s = stopMatch[1];
  }

  // Title-case and trim
  s = s.trim().replace(/\b\w/g, c => c.toUpperCase());

  // If after all this we end up with a very short or empty string, return null
  // so we don't store garbage
  return s.length >= 2 && s.length <= 80 ? s : null;
}

async function saveRecentSearch(req, res) {
  const { userId } = req.user;
  const query = String(req.body.query || '').trim();

  if (!query) {
    return res.status(400).json({ error: 'Search query is required.' });
  }

  if (query.length > 300) {
    return res.status(400).json({ error: 'Search query is too long.' });
  }

  // Extract a clean place name from the raw query
  const destination = extractDestinationFromQuery(query);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Remove duplicate query for the same user, case-insensitive
    await client.query(
      `
      DELETE FROM recent_searches
      WHERE user_id = $1
      AND LOWER(query) = LOWER($2)
      `,
      [userId, query]
    );

    // Insert newest search with extracted destination
    await client.query(
      `
      INSERT INTO recent_searches (user_id, query, destination)
      VALUES ($1, $2, $3)
      `,
      [userId, query, destination]
    );

    // Keep only latest 5 searches per user
    await client.query(
      `
      DELETE FROM recent_searches
      WHERE user_id = $1
      AND id NOT IN (
        SELECT id
        FROM recent_searches
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      )
      `,
      [userId, MAX_RECENT_SEARCHES]
    );

    const result = await client.query(
      `
      SELECT 
        id,
        query,
        created_at AS "createdAt"
      FROM recent_searches
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
      `,
      [userId, MAX_RECENT_SEARCHES]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      recentSearches: result.rows,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[saveRecentSearch] Error:', err);
    return res.status(500).json({ error: 'Failed to save recent search.' });
  } finally {
    client.release();
  }
}

module.exports = {
  getRecentSearches,
  getPopularDestinations,
  getMyAttractions,
  saveRecentSearch,
};
