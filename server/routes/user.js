const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');

// Login route
router.post('/login', userController.loginUser);

// Update location route
router.post('/update-location', userController.updateLocation);

module.exports = router;
