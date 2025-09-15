// src/routes/tournaments.routes.js
const express = require('express');
const router = express.Router();
const tournamentsCtrl = require('../controllers/tournaments.controller');

// Note: order matters — featured/stats before :slug
router.get('/featured', tournamentsCtrl.featured);
router.get('/stats', tournamentsCtrl.stats);
router.get('/', tournamentsCtrl.list);
router.get('/:slug', tournamentsCtrl.getBySlug);

module.exports = router;
