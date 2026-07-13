const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.get('/session', chatController.getOrCreateSession);
router.post('/message', chatController.sendMessage);

module.exports = router;
