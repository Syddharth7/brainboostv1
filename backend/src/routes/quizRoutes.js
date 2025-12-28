const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');

router.get('/lesson/:lessonId', quizController.getQuizByLessonId);
router.get('/topic/:topicId', quizController.getQuizByTopicId);
router.post('/attempt', quizController.submitQuizAttempt);

module.exports = router;
