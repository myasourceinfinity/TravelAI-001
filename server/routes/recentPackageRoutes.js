const express = require('express');
const router = express.Router();

const {
  listRecentPackages,
  saveRecentPackageActivity,
} = require('../controllers/recentPackageController');

router.get('/', listRecentPackages);
router.post('/', saveRecentPackageActivity);

module.exports = router;