const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');

router.get('/lesson/:lessonId', topicController.getTopicsByLessonId);
router.post('/complete', topicController.markTopicComplete);

module.exports = router;
