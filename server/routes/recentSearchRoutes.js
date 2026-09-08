const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

const {
  getRecentSearches,
  getPopularDestinations,
  getMyAttractions,
  saveRecentSearch,
} = require('../controllers/recentSearchController');

router.get('/popular', getPopularDestinations);
router.get('/my-attractions', authMiddleware, getMyAttractions);
router.get('/', getRecentSearches);
router.post('/', saveRecentSearch);

module.exports = router;
