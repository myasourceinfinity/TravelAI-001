const express = require('express');
const router = express.Router();

const {
  getRecentSearches,
  saveRecentSearch,
} = require('../controllers/recentSearchController');

router.get('/', getRecentSearches);
router.post('/', saveRecentSearch);

module.exports = router;