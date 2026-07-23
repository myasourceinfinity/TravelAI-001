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
        '' AS country,
        p.duration_days,
        p.base_price AS price_per_person,
        p.currency_code AS currency,
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
      ORDER BY p.base_price ASC`,
      destList
    );

    return res.status(200).json({ packages: result.rows });
  } catch (err) {
    console.error('[getMatchingPackages] Error:', err);
    return res.status(500).json({ error: 'Failed to fetch packages.' });
  }
};

const getMyPackages = async (req, res) => {
  const { userId } = req.user;

  try {
    const result = await pool.query(
      `SELECT
        p.id,
        p.provider_id,
        p.provider_type,
        p.package_name,
        p.destination_name,
        p.package_type,
        p.travel_mode,
        p.summary,
        p.description,
        p.duration_days,
        p.duration_nights,
        p.base_price AS price_per_person,
        p.currency_code AS currency,
        p.platform_service_fee_type,
        p.platform_service_fee_value,
        p.status,
        p.is_active,
        p.min_travelers,
        p.max_travelers,
        p.is_customizable,
        p.featured_until,
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
      JOIN user_profiles up ON p.provider_id = up.id
      LEFT JOIN agent_package_components c ON c.package_id = p.id
      WHERE up.user_id = $1 AND p.provider_type = 'Agent'
      GROUP BY p.id
      ORDER BY p.created_at DESC`,
      [userId]
    );

    return res.status(200).json({ packages: result.rows });
  } catch (err) {
    console.error('[getMyPackages] Error:', err);
    return res.status(500).json({ error: 'Failed to fetch your packages.' });
  }
};

const xlsx = require('xlsx');
const { validatePackage } = require('../utils/validationHelper');

// Helper to normalize keys (e.g. "Provider ID" or "provider_id" -> "provider_id")
function normalizeRow(row) {
  const normalized = {};
  for (const key of Object.keys(row)) {
    const normKey = key.trim().toLowerCase().replace(/[\s_]+/g, '_');
    normalized[normKey] = row[key];
  }
  return normalized;
}

// Helper to parse values into schema-expected types
function castRow(row) {
  const casted = { ...row };

  if (row.provider_id !== undefined) {
    const pId = Number(row.provider_id);
    if (!isNaN(pId)) casted.provider_id = pId;
  }

  if (row.duration_days !== undefined && row.duration_days !== '') {
    const val = Number(row.duration_days);
    if (!isNaN(val)) casted.duration_days = val;
  }
  if (row.duration_nights !== undefined && row.duration_nights !== '') {
    const val = Number(row.duration_nights);
    if (!isNaN(val)) casted.duration_nights = val;
  }

  if (row.base_price !== undefined && row.base_price !== '') {
    const val = Number(row.base_price);
    if (!isNaN(val)) casted.base_price = val;
  }
  if (row.platform_service_fee_value !== undefined && row.platform_service_fee_value !== '') {
    const val = Number(row.platform_service_fee_value);
    if (!isNaN(val)) casted.platform_service_fee_value = val;
  }

  if (row.min_travelers !== undefined && row.min_travelers !== '') {
    const val = Number(row.min_travelers);
    if (!isNaN(val)) casted.min_travelers = val;
  }
  if (row.max_travelers !== undefined && row.max_travelers !== '') {
    const val = Number(row.max_travelers);
    if (!isNaN(val)) casted.max_travelers = val;
  }

  // Cast booleans
  const parseBool = (val) => {
    if (val === undefined || val === null || val === '') return undefined;
    if (typeof val === 'boolean') return val;
    const s = String(val).trim().toLowerCase();
    if (s === 'true' || s === '1' || s === 'yes' || s === 'y') return true;
    if (s === 'false' || s === '0' || s === 'no' || s === 'n') return false;
    return val; // leave as-is for validation to fail if invalid
  };

  if (row.is_customizable !== undefined) casted.is_customizable = parseBool(row.is_customizable);
  if (row.is_active !== undefined) casted.is_active = parseBool(row.is_active);

  return casted;
}

// 1. Single Package Creation
const createSinglePackage = async (req, res) => {
  const allowedRoles = new Set(['agent', 'admin', 'superadmin', 'useradmin']);
  if (!allowedRoles.has(req.user.role_type)) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const pkg = castRow(req.body);
  const validationErrors = validatePackage(pkg);

  if (validationErrors.length > 0) {
    return res.status(400).json({ error: 'Validation failed.', details: validationErrors });
  }

  const dbClient = await pool.connect();
  try {
    // Verify provider exists and is active
    const providerCheck = await dbClient.query(
      `SELECT u.status 
       FROM user_profiles up
       JOIN users u ON up.user_id = u.id
       WHERE up.id = $1`,
      [pkg.provider_id]
    );

    if (providerCheck.rows.length === 0) {
      return res.status(400).json({ error: `Provider profile ID ${pkg.provider_id} does not exist.` });
    }
    if (providerCheck.rows[0].status !== 'active') {
      return res.status(400).json({ error: `Provider account is not active (status: ${providerCheck.rows[0].status}).` });
    }

    const queryText = `
      INSERT INTO agent_packages (
        provider_id, provider_type, destination_name, package_name, package_type,
        travel_mode, summary, description, duration_days, duration_nights,
        base_price, currency_code, platform_service_fee_type, platform_service_fee_value,
        min_travelers, max_travelers, is_customizable, status, is_active, featured_until
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING id, package_name;
    `;

    const values = [
      pkg.provider_id,
      pkg.provider_type,
      pkg.destination_name,
      pkg.package_name,
      pkg.package_type,
      pkg.travel_mode || null,
      pkg.summary || null,
      pkg.description || null,
      pkg.duration_days,
      pkg.duration_nights,
      pkg.base_price,
      pkg.currency_code,
      pkg.platform_service_fee_type || null,
      pkg.platform_service_fee_value || null,
      pkg.min_travelers,
      pkg.max_travelers,
      pkg.is_customizable,
      pkg.status,
      pkg.is_active,
      pkg.featured_until || null
    ];

    const result = await dbClient.query(queryText, values);
    return res.status(201).json({ message: 'Package created successfully.', package: result.rows[0] });

  } catch (err) {
    console.error('[createSinglePackage] Error:', err);
    return res.status(500).json({ error: 'Failed to create package due to server error.' });
  } finally {
    dbClient.release();
  }
};

// 2. Parse and Validate Bulk Packages (No DB writes)
const parseAndValidateBulkPackages = async (req, res) => {
  const allowedRoles = new Set(['agent', 'admin', 'superadmin', 'useradmin']);
  if (!allowedRoles.has(req.user.role_type)) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const overwrite = req.body.overwrite === 'true' || req.query.overwrite === 'true' || req.body.overwrite === true;

  let rows = [];
  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
  } catch (parseErr) {
    return res.status(400).json({ error: 'Failed to parse file. Ensure it is a valid CSV, Excel, or delimited TXT file.' });
  }

  if (rows.length === 0) {
    return res.status(400).json({ error: 'The uploaded file is empty.' });
  }

  const dbClient = await pool.connect();
  try {
    const parsedRows = [];
    let validCount = 0;
    let invalidCount = 0;
    const fileKeys = new Set();

    for (let i = 0; i < rows.length; i++) {
      const rowIndex = i + 2; // Excel-style row number
      const rawRow = normalizeRow(rows[i]);
      const pkg = castRow(rawRow);

      const errors = validatePackage(pkg);

      // Verify provider exists and is active
      if (pkg.provider_id && !isNaN(pkg.provider_id)) {
        const providerCheck = await dbClient.query(
          `SELECT u.status 
           FROM user_profiles up
           JOIN users u ON up.user_id = u.id
           WHERE up.id = $1`,
          [pkg.provider_id]
        );

        if (providerCheck.rows.length === 0) {
          errors.push(`provider_id ${pkg.provider_id} does not exist`);
        } else if (providerCheck.rows[0].status !== 'active') {
          errors.push(`provider_id ${pkg.provider_id} is not an active user`);
        }
      } else {
        errors.push('provider_id is missing or invalid');
      }

      // Duplicate checking (File-level and DB-level)
      pkg.isUpdate = false;
      if (pkg.package_name && pkg.provider_id) {
        const key = `${pkg.provider_id}::${(pkg.package_name || '').trim().toLowerCase()}`;
        if (fileKeys.has(key)) {
          errors.push(`Duplicate package name "${pkg.package_name}" found in the uploaded file.`);
        } else {
          fileKeys.add(key);
        }

        const dbDupCheck = await dbClient.query(
          `SELECT id FROM agent_packages 
           WHERE provider_id = $1 AND LOWER(TRIM(package_name)) = LOWER(TRIM($2))`,
          [pkg.provider_id, pkg.package_name]
        );
        if (dbDupCheck.rows.length > 0) {
          if (!overwrite) {
            errors.push(`Duplicate package name "${pkg.package_name}" already exists in the system database.`);
          } else {
            pkg.isUpdate = true;
            pkg.existingId = dbDupCheck.rows[0].id;
          }
        }
      }

      const isValid = errors.length === 0;
      if (isValid) {
        validCount++;
      } else {
        invalidCount++;
      }

      parsedRows.push({
        rowNumber: rowIndex,
        isValid,
        errors,
        data: pkg
      });
    }

    return res.status(200).json({
      success: true,
      totalRows: rows.length,
      validCount,
      invalidCount,
      packages: parsedRows
    });

  } catch (err) {
    console.error('[parseAndValidateBulkPackages] Error:', err);
    return res.status(500).json({ error: 'Failed to validate packages due to an internal server error.' });
  } finally {
    dbClient.release();
  }
};

// 2b. Confirm and Save Bulk Packages
const confirmBulkImportPackages = async (req, res) => {
  const allowedRoles = new Set(['agent', 'admin', 'superadmin', 'useradmin']);
  if (!allowedRoles.has(req.user.role_type)) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { packages, overwrite } = req.body;
  if (!Array.isArray(packages) || packages.length === 0) {
    return res.status(400).json({ error: 'No packages provided for import.' });
  }

  const dbClient = await pool.connect();
  try {
    // Re-validate everything to prevent API tampering and check duplicates
    const validatedPackages = [];
    const fileKeys = new Set();

    for (let i = 0; i < packages.length; i++) {
      const pkg = castRow(packages[i]);
      const errors = validatePackage(pkg);

      if (pkg.provider_id) {
        const providerCheck = await dbClient.query(
          `SELECT u.status FROM user_profiles up JOIN users u ON up.user_id = u.id WHERE up.id = $1`,
          [pkg.provider_id]
        );
        if (providerCheck.rows.length === 0 || providerCheck.rows[0].status !== 'active') {
          errors.push('Invalid or inactive provider_id.');
        }
      } else {
        errors.push('provider_id is required.');
      }

      // Check duplicates
      if (pkg.package_name && pkg.provider_id) {
        const key = `${pkg.provider_id}::${(pkg.package_name || '').trim().toLowerCase()}`;
        if (fileKeys.has(key)) {
          errors.push(`Duplicate package name "${pkg.package_name}" found in the import payload.`);
        } else {
          fileKeys.add(key);
        }

        const dbDupCheck = await dbClient.query(
          `SELECT id FROM agent_packages 
           WHERE provider_id = $1 AND LOWER(TRIM(package_name)) = LOWER(TRIM($2))`,
          [pkg.provider_id, pkg.package_name]
        );
        if (dbDupCheck.rows.length > 0 && !overwrite) {
          errors.push(`Duplicate package name "${pkg.package_name}" already exists in the system database.`);
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          error: `Package "${pkg.package_name || 'Untitled'}" failed validation.`,
          details: errors
        });
      }
      validatedPackages.push(pkg);
    }

    // Insert or Update inside a transaction
    await dbClient.query('BEGIN');

    const insertQuery = `
      INSERT INTO agent_packages (
        provider_id, provider_type, destination_name, package_name, package_type,
        travel_mode, summary, description, duration_days, duration_nights,
        base_price, currency_code, platform_service_fee_type, platform_service_fee_value,
        min_travelers, max_travelers, is_customizable, status, is_active, featured_until
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20);
    `;

    const updateQuery = `
      UPDATE agent_packages SET
        provider_type = $2,
        destination_name = $3,
        package_type = $5,
        travel_mode = $6,
        summary = $7,
        description = $8,
        duration_days = $9,
        duration_nights = $10,
        base_price = $11,
        currency_code = $12,
        platform_service_fee_type = $13,
        platform_service_fee_value = $14,
        min_travelers = $15,
        max_travelers = $16,
        is_customizable = $17,
        status = $18,
        is_active = $19,
        featured_until = $20
      WHERE id = $21;
    `;

    for (const pkg of validatedPackages) {
      let existingId = null;
      if (overwrite && pkg.package_name && pkg.provider_id) {
        const dbDupCheck = await dbClient.query(
          `SELECT id FROM agent_packages WHERE provider_id = $1 AND LOWER(TRIM(package_name)) = LOWER(TRIM($2))`,
          [pkg.provider_id, pkg.package_name]
        );
        if (dbDupCheck.rows.length > 0) {
          existingId = dbDupCheck.rows[0].id;
        }
      }

      if (existingId) {
        const values = [
          pkg.provider_id,
          pkg.provider_type,
          pkg.destination_name,
          pkg.package_name,
          pkg.package_type,
          pkg.travel_mode || null,
          pkg.summary || null,
          pkg.description || null,
          pkg.duration_days,
          pkg.duration_nights,
          pkg.base_price,
          pkg.currency_code,
          pkg.platform_service_fee_type || null,
          pkg.platform_service_fee_value || null,
          pkg.min_travelers,
          pkg.max_travelers,
          pkg.is_customizable,
          pkg.status,
          pkg.is_active,
          pkg.featured_until || null,
          existingId
        ];
        await dbClient.query(updateQuery, values);
      } else {
        const values = [
          pkg.provider_id,
          pkg.provider_type,
          pkg.destination_name,
          pkg.package_name,
          pkg.package_type,
          pkg.travel_mode || null,
          pkg.summary || null,
          pkg.description || null,
          pkg.duration_days,
          pkg.duration_nights,
          pkg.base_price,
          pkg.currency_code,
          pkg.platform_service_fee_type || null,
          pkg.platform_service_fee_value || null,
          pkg.min_travelers,
          pkg.max_travelers,
          pkg.is_customizable,
          pkg.status,
          pkg.is_active,
          pkg.featured_until || null
        ];
        await dbClient.query(insertQuery, values);
      }
    }

    await dbClient.query('COMMIT');
    return res.status(201).json({
      message: `Successfully processed ${validatedPackages.length} package(s).`
    });

  } catch (err) {
    await dbClient.query('ROLLBACK').catch(() => {});
    console.error('[confirmBulkImportPackages] Transaction rolled back due to error:', err);
    return res.status(500).json({ error: 'Failed to import packages due to a database transaction error.' });
  } finally {
    dbClient.release();
  }
};

// 3. Update Single Package
const updateSinglePackage = async (req, res) => {
  const allowedRoles = new Set(['agent', 'admin', 'superadmin', 'useradmin']);
  if (!allowedRoles.has(req.user.role_type)) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { id } = req.params;
  const pkg = castRow(req.body);
  const validationErrors = validatePackage(pkg);

  if (validationErrors.length > 0) {
    return res.status(400).json({ error: 'Validation failed.', details: validationErrors });
  }

  const dbClient = await pool.connect();
  try {
    // Verify package exists
    const pkgCheck = await dbClient.query('SELECT provider_id FROM agent_packages WHERE id = $1', [id]);
    if (pkgCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found.' });
    }

    // Authorization check
    const { userId, role_type } = req.user;
    const isAdmin = ['admin', 'superadmin', 'useradmin'].includes(role_type);
    
    if (!isAdmin) {
      const profileRes = await dbClient.query('SELECT id FROM user_profiles WHERE user_id = $1', [userId]);
      const userProfileId = profileRes.rows[0]?.id;
      if (!userProfileId || Number(userProfileId) !== Number(pkgCheck.rows[0].provider_id)) {
        return res.status(403).json({ error: 'Unauthorized. You cannot modify another provider\'s package.' });
      }
    }

    // Verify target provider_id exists and is active
    const providerCheck = await dbClient.query(
      `SELECT u.status 
       FROM user_profiles up
       JOIN users u ON up.user_id = u.id
       WHERE up.id = $1`,
      [pkg.provider_id]
    );

    if (providerCheck.rows.length === 0) {
      return res.status(400).json({ error: `Provider profile ID ${pkg.provider_id} does not exist.` });
    }
    if (providerCheck.rows[0].status !== 'active') {
      return res.status(400).json({ error: `Provider account is not active.` });
    }

    const queryText = `
      UPDATE agent_packages
      SET 
        provider_id = $1,
        provider_type = $2,
        destination_name = $3,
        package_name = $4,
        package_type = $5,
        travel_mode = $6,
        summary = $7,
        description = $8,
        duration_days = $9,
        duration_nights = $10,
        base_price = $11,
        currency_code = $12,
        platform_service_fee_type = $13,
        platform_service_fee_value = $14,
        min_travelers = $15,
        max_travelers = $16,
        is_customizable = $17,
        status = $18,
        is_active = $19,
        featured_until = $20,
        updated_at = NOW()
      WHERE id = $21
      RETURNING id, package_name;
    `;

    const values = [
      pkg.provider_id,
      pkg.provider_type,
      pkg.destination_name,
      pkg.package_name,
      pkg.package_type,
      pkg.travel_mode || null,
      pkg.summary || null,
      pkg.description || null,
      pkg.duration_days,
      pkg.duration_nights,
      pkg.base_price,
      pkg.currency_code,
      pkg.platform_service_fee_type || null,
      pkg.platform_service_fee_value || null,
      pkg.min_travelers,
      pkg.max_travelers,
      pkg.is_customizable,
      pkg.status,
      pkg.is_active,
      pkg.featured_until || null,
      id
    ];

    const result = await dbClient.query(queryText, values);
    return res.status(200).json({ message: 'Package updated successfully.', package: result.rows[0] });

  } catch (err) {
    console.error('[updateSinglePackage] Error:', err);
    return res.status(500).json({ error: 'Failed to update package due to server error.' });
  } finally {
    dbClient.release();
  }
};

module.exports = {
  getMatchingPackages,
  getMyPackages,
  createSinglePackage,
  parseAndValidateBulkPackages,
  confirmBulkImportPackages,
  updateSinglePackage
};


