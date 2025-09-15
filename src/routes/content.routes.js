// src/routes/content.routes.js
const express = require('express');
const router = express.Router();
const contentCtrl = require('../controllers/content.controller');

router.get('/sponsored', contentCtrl.sponsored);
router.get('/highlights', contentCtrl.highlights);

module.exports = router;
