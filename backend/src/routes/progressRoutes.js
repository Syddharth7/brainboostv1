const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');

router.post('/topic', progressController.updateTopicProgress);
router.get('/:userId', progressController.getUserProgress);

module.exports = router;
