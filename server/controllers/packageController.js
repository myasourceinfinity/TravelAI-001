/**
 * packageController.js
 *
 * GET /api/packages?destinations=Auckland,Rotorua
 * Returns all active agent packages whose destination_name matches
 * any of the supplied destination names (case-insensitive).
 */
const pool = require('../config/db');

const getMatchingPackages = async (req, res) => {
  const { destinations } = req.query;

  if (!destinations) {
    return res.status(400).json({ error: 'destinations query param is required.' });
  }

  // Split comma-separated list, trim, lowercase
  const destList = destinations
    .split(',')
    .map(d => d.trim().toLowerCase())
    .filter(Boolean);

  if (destList.length === 0) {
    return res.status(400).json({ error: 'At least one destination is required.' });
  }

  try {
    // Build $1, $2, $3 ... placeholders
    const placeholders = destList.map((_, i) => `$${i + 1}`).join(', ');

    const result = await pool.query(
      `SELECT
        p.id,
        p.package_name,
        p.destination_name,
        p.country,
        p.duration_days,
        p.price_per_person,
        p.currency,
        p.description,
        COALESCE(
          json_agg(
            json_build_object(
              'id',               c.id,
              'componentType',    c.component_type,
              'title',            c.title,
              'description',      c.description,
              'provider',         c.provider,
              'pricePerPerson',   c.price_per_person,
              'isIncluded',       c.is_included
            ) ORDER BY c.sort_order
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'
        ) AS components
      FROM agent_packages p
      LEFT JOIN agent_package_components c ON c.package_id = p.id
      WHERE p.is_active = true
        AND LOWER(p.destination_name) = ANY(ARRAY[${placeholders}])
      GROUP BY p.id
      ORDER BY p.price_per_person ASC`,
      destList
    );

    return res.status(200).json({ packages: result.rows });
  } catch (err) {
    console.error('[getMatchingPackages] Error:', err);
    return res.status(500).json({ error: 'Failed to fetch packages.' });
  }
};

module.exports = { getMatchingPackages };
