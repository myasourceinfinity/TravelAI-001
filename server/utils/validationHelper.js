/**
 * validationHelper.js
 *
 * Validates a single package object against the 23-column DB schema.
 * Returns an array of error strings, or an empty array if valid.
 */

const VALID_TRAVEL_MODES = new Set(['flight', 'train', 'bus', 'car', 'cruise', 'coach', 'ferry', 'multi-mode']);
const VALID_PACKAGE_TYPES = new Set(['adventure', 'leisure', 'honeymoon', 'family', 'wellness', 'business', 'custom', 'cultural']);
const VALID_STATUSES = new Set(['draft', 'active', 'archived']);
const VALID_FEE_TYPES = new Set(['fixed', 'percentage']);

function validatePackage(pkg) {
  const errors = [];

  // 1. provider_id check
  if (pkg.provider_id === undefined || pkg.provider_id === null || pkg.provider_id === '') {
    errors.push('provider_id is required');
  } else {
    const val = Number(pkg.provider_id);
    if (isNaN(val) || !Number.isInteger(val)) {
      errors.push('provider_id must be a valid integer');
    }
  }

  // 2. provider_type
  if (!pkg.provider_type || String(pkg.provider_type).trim() === '') {
    errors.push('provider_type is required');
  } else if (String(pkg.provider_type).length > 20) {
    errors.push('provider_type must be 20 characters or less');
  }

  // 3. destination_name
  if (!pkg.destination_name || String(pkg.destination_name).trim() === '') {
    errors.push('destination_name is required');
  } else if (String(pkg.destination_name).length > 255) {
    errors.push('destination_name must be 255 characters or less');
  }

  // 4. package_name
  if (!pkg.package_name || String(pkg.package_name).trim() === '') {
    errors.push('package_name is required');
  } else if (String(pkg.package_name).length > 255) {
    errors.push('package_name must be 255 characters or less');
  }

  // 5. package_type
  if (!pkg.package_type || String(pkg.package_type).trim() === '') {
    errors.push('package_type is required');
  } else {
    const val = String(pkg.package_type).trim().toLowerCase();
    if (!VALID_PACKAGE_TYPES.has(val)) {
      errors.push(`package_type must be one of: ${Array.from(VALID_PACKAGE_TYPES).join(', ')}`);
    }
  }

  // 6. travel_mode (optional/nullable)
  if (pkg.travel_mode !== undefined && pkg.travel_mode !== null && String(pkg.travel_mode).trim() !== '') {
    const val = String(pkg.travel_mode).trim().toLowerCase();
    if (!VALID_TRAVEL_MODES.has(val)) {
      errors.push(`travel_mode must be one of: ${Array.from(VALID_TRAVEL_MODES).join(', ')}`);
    }
  }

  // 7. duration_days
  if (pkg.duration_days === undefined || pkg.duration_days === null || pkg.duration_days === '') {
    errors.push('duration_days is required');
  } else {
    const val = Number(pkg.duration_days);
    if (isNaN(val) || !Number.isInteger(val) || val < 0) {
      errors.push('duration_days must be a non-negative integer');
    }
  }

  // 8. duration_nights
  if (pkg.duration_nights === undefined || pkg.duration_nights === null || pkg.duration_nights === '') {
    errors.push('duration_nights is required');
  } else {
    const val = Number(pkg.duration_nights);
    if (isNaN(val) || !Number.isInteger(val) || val < 0) {
      errors.push('duration_nights must be a non-negative integer');
    }
  }

  // Days >= Nights check (typical rule)
  if (
    pkg.duration_days !== undefined && pkg.duration_days !== null && pkg.duration_days !== '' &&
    pkg.duration_nights !== undefined && pkg.duration_nights !== null && pkg.duration_nights !== ''
  ) {
    const d = Number(pkg.duration_days);
    const n = Number(pkg.duration_nights);
    if (!isNaN(d) && !isNaN(n) && d < n) {
      errors.push('duration_days should typically be greater than or equal to duration_nights');
    }
  }

  // 9. base_price
  if (pkg.base_price === undefined || pkg.base_price === null || pkg.base_price === '') {
    errors.push('base_price is required');
  } else {
    const val = Number(pkg.base_price);
    if (isNaN(val) || val < 0) {
      errors.push('base_price must be a numeric value >= 0.00');
    }
  }

  // 10. currency_code
  if (!pkg.currency_code || String(pkg.currency_code).trim() === '') {
    errors.push('currency_code is required');
  } else if (String(pkg.currency_code).trim().length !== 3) {
    errors.push('currency_code must be a valid 3-letter ISO code');
  }

  // 11. platform_service_fee_type (optional/nullable)
  if (pkg.platform_service_fee_type !== undefined && pkg.platform_service_fee_type !== null && String(pkg.platform_service_fee_type).trim() !== '') {
    const val = String(pkg.platform_service_fee_type).trim().toLowerCase();
    if (!VALID_FEE_TYPES.has(val)) {
      errors.push(`platform_service_fee_type must be: ${Array.from(VALID_FEE_TYPES).join(', ')}`);
    }
  }

  // 12. platform_service_fee_value (optional/nullable)
  if (pkg.platform_service_fee_value !== undefined && pkg.platform_service_fee_value !== null && pkg.platform_service_fee_value !== '') {
    const val = Number(pkg.platform_service_fee_value);
    if (isNaN(val) || val < 0) {
      errors.push('platform_service_fee_value must be a numeric value >= 0.00');
    }
  }

  // 13. min_travelers
  if (pkg.min_travelers === undefined || pkg.min_travelers === null || pkg.min_travelers === '') {
    errors.push('min_travelers is required');
  } else {
    const val = Number(pkg.min_travelers);
    if (isNaN(val) || !Number.isInteger(val) || val < 1) {
      errors.push('min_travelers must be an integer >= 1');
    }
  }

  // 14. max_travelers
  if (pkg.max_travelers === undefined || pkg.max_travelers === null || pkg.max_travelers === '') {
    errors.push('max_travelers is required');
  } else {
    const val = Number(pkg.max_travelers);
    const minVal = Number(pkg.min_travelers);
    if (isNaN(val) || !Number.isInteger(val)) {
      errors.push('max_travelers must be an integer');
    } else if (!isNaN(minVal) && val < minVal) {
      errors.push('max_travelers must be greater than or equal to min_travelers');
    }
  }

  // 15. status
  if (!pkg.status || String(pkg.status).trim() === '') {
    errors.push('status is required');
  } else {
    const val = String(pkg.status).trim().toLowerCase();
    if (!VALID_STATUSES.has(val)) {
      errors.push(`status must be one of: ${Array.from(VALID_STATUSES).join(', ')}`);
    }
  }

  // 16. Booleans: is_customizable & is_active
  if (pkg.is_customizable === undefined || pkg.is_customizable === null || pkg.is_customizable === '') {
    errors.push('is_customizable (boolean) is required');
  }
  if (pkg.is_active === undefined || pkg.is_active === null || pkg.is_active === '') {
    errors.push('is_active (boolean) is required');
  }

  return errors;
}

module.exports = {
  validatePackage,
  VALID_TRAVEL_MODES: Array.from(VALID_TRAVEL_MODES),
  VALID_PACKAGE_TYPES: Array.from(VALID_PACKAGE_TYPES),
  VALID_STATUSES: Array.from(VALID_STATUSES),
  VALID_FEE_TYPES: Array.from(VALID_FEE_TYPES)
};
