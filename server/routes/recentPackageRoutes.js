const express = require('express');
const router = express.Router();

const {
  listRecentPackages,
  saveRecentPackageActivity,
  listAgentEnquiries,
  addEnquiryFollowUp,
} = require('../controllers/recentPackageController');

router.get('/', listRecentPackages);
router.get('/agent', listAgentEnquiries);
router.post('/', saveRecentPackageActivity);
router.post('/enquiries/:id/follow-ups', addEnquiryFollowUp);

module.exports = router;