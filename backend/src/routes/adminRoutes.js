const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Middleware to check if user is admin should be added here
// const isAdmin = require('../middleware/isAdmin');

router.get('/students', adminController.getAllStudents);
router.get('/students/:studentId/progress', adminController.getStudentProgress);
router.post('/lessons', adminController.createLesson);

module.exports = router;
