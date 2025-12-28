const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');

router.get('/', achievementController.getAll);
router.get('/user/:userId', achievementController.getUserAchievements);
router.post('/check', achievementController.checkUnlock);

module.exports = router;
