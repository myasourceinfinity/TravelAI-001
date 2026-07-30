const pool = require('../config/db');

const MAX_RECENT_SEARCHES = 5;

async function getRecentSearches(req, res) {
  const { userId } = req.user;

  try {
    const result = await pool.query(
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

    return res.status(200).json({
      recentSearches: result.rows,
    });
  } catch (err) {
    console.error('[getRecentSearches] Error:', err);
    return res.status(500).json({ error: 'Failed to load recent searches.' });
  }
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

    // Insert newest search
    await client.query(
      `
      INSERT INTO recent_searches (user_id, query)
      VALUES ($1, $2)
      `,
      [userId, query]
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
  saveRecentSearch,
};