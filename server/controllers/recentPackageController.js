const pool = require('../config/db');
const { sendEnquiryEmail } = require('../utils/emailHelper');

function getAuthUserId(req) {
  return req.user?.userId || req.user?.id;
}

const listRecentPackages = async (req, res) => {
  const userId = getAuthUserId(req);

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT
         rpa.id,
         rpa.activity_type,
         rpa.interaction_count,
         rpa.last_interacted_at,
         rpa.offer_price,
         ap.id AS package_id,
         ap.package_name,
         ap.destination_name,
         ap.package_type,
         ap.travel_mode,
         ap.duration_days,
         ap.duration_nights,
         ap.base_price,
         ap.currency_code,
         ap.status,
         ap.is_active,
         u.id AS agent_user_id,
         u.first_name AS agent_first_name,
         u.last_name AS agent_last_name
       FROM recent_package_activity rpa
       JOIN agent_packages ap
         ON ap.id = rpa.package_id
       LEFT JOIN user_profiles up
         ON up.id = ap.provider_id
       LEFT JOIN users u
         ON u.id = up.user_id
       WHERE rpa.user_id = $1
         AND ap.provider_type = 'Agent'
       ORDER BY rpa.last_interacted_at DESC
       LIMIT 5`,
      [userId]
    );

    return res.json({ recentPackages: rows });
  } catch (err) {
    console.error('[listRecentPackages] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch recent packages.' });
  }
};

const saveRecentPackageActivity = async (req, res) => {
  const userId = getAuthUserId(req);
  const packageId = Number(req.body.packageId);
  const activityType = req.body.activityType || 'enquire';
  const offerPrice = req.body.offerPrice ? Number(req.body.offerPrice) : null;
  const preferredContactMethod = req.body.preferredContactMethod || null;
  const enquiryQuestion = req.body.enquiryQuestion || null;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (!Number.isInteger(packageId) || packageId <= 0) {
    return res.status(400).json({ error: 'Valid packageId is required.' });
  }

  if (!['view', 'enquire'].includes(activityType)) {
    return res.status(400).json({ error: 'Invalid activity type.' });
  }

  if (preferredContactMethod && !['email', 'phone'].includes(preferredContactMethod)) {
    return res.status(400).json({ error: 'Invalid preferred contact method.' });
  }

  try {
    const userCheck = await pool.query(
      `SELECT role_type, status
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (userCheck.rows.length === 0 || userCheck.rows[0].status !== 'active') {
      return res.status(403).json({ error: 'User account is not active.' });
    }

    if (['agent', 'admin', 'useradmin', 'superadmin'].includes(userCheck.rows[0].role_type)) {
      return res.status(403).json({ error: 'Only travellers can save recent package activity.' });
    }

    const packageCheck = await pool.query(
      `SELECT id
       FROM agent_packages
       WHERE id = $1
         AND provider_type = 'Agent'`,
      [packageId]
    );

    if (packageCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found.' });
    }

    await pool.query(
      `INSERT INTO recent_package_activity (
         user_id,
         package_id,
         activity_type,
         offer_price,
         preferred_contact_method,
         enquiry_question
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, package_id)
       DO UPDATE SET
         activity_type = EXCLUDED.activity_type,
         offer_price = CASE WHEN EXCLUDED.activity_type = 'enquire' THEN EXCLUDED.offer_price ELSE COALESCE(EXCLUDED.offer_price, recent_package_activity.offer_price) END,
         preferred_contact_method = CASE WHEN EXCLUDED.activity_type = 'enquire' THEN EXCLUDED.preferred_contact_method ELSE COALESCE(EXCLUDED.preferred_contact_method, recent_package_activity.preferred_contact_method) END,
         enquiry_question = CASE WHEN EXCLUDED.activity_type = 'enquire' THEN EXCLUDED.enquiry_question ELSE COALESCE(EXCLUDED.enquiry_question, recent_package_activity.enquiry_question) END,
         interaction_count = recent_package_activity.interaction_count + 1,
         last_interacted_at = NOW()`,
      [userId, packageId, activityType, offerPrice, preferredContactMethod, enquiryQuestion]
    );

    // Send email to associated agent if this is an enquiry with contact details
    if (activityType === 'enquire' && preferredContactMethod) {
      try {
        // Fetch traveler details
        const travellerRes = await pool.query(
          `SELECT first_name, last_name, email, phone FROM users WHERE id = $1`,
          [userId]
        );
        const traveller = travellerRes.rows[0];

        // Fetch package details and agent email
        const packageRes = await pool.query(
          `SELECT ap.package_name, ap.currency_code,
                  u.email AS agent_email, u.first_name AS agent_first_name, u.last_name AS agent_last_name
           FROM agent_packages ap
           LEFT JOIN user_profiles up ON up.id = ap.provider_id
           LEFT JOIN users u ON u.id = up.user_id
           WHERE ap.id = $1`,
          [packageId]
        );
        const pkgDetails = packageRes.rows[0];

        if (traveller && pkgDetails && pkgDetails.agent_email) {
          sendEnquiryEmail({
            agentEmail:             pkgDetails.agent_email,
            agentName:              `${pkgDetails.agent_first_name} ${pkgDetails.agent_last_name || ''}`.trim(),
            travellerName:          `${traveller.first_name} ${traveller.last_name || ''}`.trim(),
            travellerEmail:         traveller.email,
            travellerPhone:         traveller.phone,
            packageName:            pkgDetails.package_name,
            offerPrice:             offerPrice ? `${pkgDetails.currency_code || 'NZD'} ${offerPrice}` : null,
            preferredContactMethod: preferredContactMethod,
            question:               enquiryQuestion
          }).catch(err => {
            console.error('[saveRecentPackageActivity] Failed to send enquiry email:', err.message);
          });
        }
      } catch (err) {
        console.error('[saveRecentPackageActivity] Error preparing enquiry email:', err.message);
      }
    }

    const { rows } = await pool.query(
      `SELECT
         rpa.id,
         rpa.activity_type,
         rpa.interaction_count,
         rpa.last_interacted_at,
         rpa.offer_price,
         ap.id AS package_id,
         ap.package_name,
         ap.destination_name,
         ap.package_type,
         ap.travel_mode,
         ap.duration_days,
         ap.duration_nights,
         ap.base_price,
         ap.currency_code,
         u.id AS agent_user_id,
         u.first_name AS agent_first_name,
         u.last_name AS agent_last_name
       FROM recent_package_activity rpa
       JOIN agent_packages ap
         ON ap.id = rpa.package_id
       LEFT JOIN user_profiles up
         ON up.id = ap.provider_id
       LEFT JOIN users u
         ON u.id = up.user_id
       WHERE rpa.user_id = $1
       ORDER BY rpa.last_interacted_at DESC
       LIMIT 5`,
      [userId]
    );

    return res.status(201).json({ recentPackages: rows });
  } catch (err) {
    console.error('[saveRecentPackageActivity] Error:', err.message);
    return res.status(500).json({ error: 'Failed to save recent package activity.' });
  }
};

const listAgentEnquiries = async (req, res) => {
  const userId = getAuthUserId(req);

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT
         rpa.id,
         rpa.activity_type,
         rpa.interaction_count,
         rpa.last_interacted_at,
         rpa.offer_price,
         rpa.preferred_contact_method,
         rpa.enquiry_question,
         (
           SELECT COALESCE(
             json_agg(
               json_build_object(
                 'id', efu.id,
                 'note_type', efu.note_type,
                 'note_text', efu.note_text,
                 'created_at', efu.created_at
               ) ORDER BY efu.created_at DESC
             ),
             '[]'::json
           )
           FROM enquiry_follow_ups efu
           WHERE efu.activity_id = rpa.id
         ) AS follow_ups,
         ap.id AS package_id,
         ap.package_name,
         ap.destination_name,
         ap.base_price,
         ap.currency_code,
         u.first_name AS traveller_first_name,
         u.last_name AS traveller_last_name,
         u.email AS traveller_email,
         u.phone AS traveller_phone
       FROM recent_package_activity rpa
       JOIN agent_packages ap
         ON ap.id = rpa.package_id
       JOIN users u
         ON u.id = rpa.user_id
       WHERE ap.provider_id = (SELECT id FROM user_profiles WHERE user_id = $1)
         AND rpa.activity_type = 'enquire'
       ORDER BY rpa.last_interacted_at DESC`,
      [userId]
    );

    return res.json({ enquiries: rows });
  } catch (err) {
    console.error('[listAgentEnquiries] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch agent enquiries.' });
  }
};

const addEnquiryFollowUp = async (req, res) => {
  const userId = getAuthUserId(req);
  const activityId = Number(req.params.id);
  const { noteType, noteText } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (!Number.isInteger(activityId) || activityId <= 0) {
    return res.status(400).json({ error: 'Valid activity ID is required.' });
  }

  if (!noteType || !['note', 'phone', 'email', 'meeting'].includes(noteType)) {
    return res.status(400).json({ error: 'Valid note type is required.' });
  }

  if (!noteText || !noteText.trim()) {
    return res.status(400).json({ error: 'Note text cannot be empty.' });
  }

  try {
    const userCheck = await pool.query(
      `SELECT role_type, status FROM users WHERE id = $1`,
      [userId]
    );

    if (userCheck.rows.length === 0 || userCheck.rows[0].status !== 'active') {
      return res.status(403).json({ error: 'User account is not active.' });
    }

    if (userCheck.rows[0].role_type !== 'agent') {
      return res.status(403).json({ error: 'Access denied. Only agents can update notes.' });
    }

    const agentCheck = await pool.query(
      `SELECT rpa.id
       FROM recent_package_activity rpa
       JOIN agent_packages ap ON ap.id = rpa.package_id
       JOIN user_profiles up ON up.id = ap.provider_id
       WHERE rpa.id = $1 AND up.user_id = $2`,
      [activityId, userId]
    );

    if (agentCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied. You do not manage this package.' });
    }

    // Insert new follow-up note
    const { rows } = await pool.query(
      `INSERT INTO enquiry_follow_ups (activity_id, note_type, note_text)
       VALUES ($1, $2, $3)
       RETURNING id, note_type, note_text, created_at`,
      [activityId, noteType, noteText.trim()]
    );

    // Update last_interacted_at on the parent activity
    await pool.query(
      `UPDATE recent_package_activity SET last_interacted_at = NOW() WHERE id = $1`,
      [activityId]
    );

    return res.status(201).json({ followUp: rows[0] });
  } catch (err) {
    console.error('[addEnquiryFollowUp] Error:', err.message);
    return res.status(500).json({ error: 'Failed to add follow-up log.' });
  }
};

module.exports = {
  listRecentPackages,
  saveRecentPackageActivity,
  listAgentEnquiries,
  addEnquiryFollowUp,
};