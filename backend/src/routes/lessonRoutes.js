const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');

router.get('/', lessonController.getAllLessons);
router.get('/:id', lessonController.getLessonById);
router.get('/:lessonId/topics', lessonController.getTopicsByLessonId);

module.exports = router;
