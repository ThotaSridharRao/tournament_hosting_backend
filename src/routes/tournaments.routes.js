// src/routes/tournaments.routes.js
const express = require('express');
const router = express.Router();
const tournamentsCtrl = require('../controllers/tournaments.controller');

// GET /api/tournaments
router.get('/', tournamentsCtrl.list);

// GET /api/tournaments/:slug
router.get('/:slug', tournamentsCtrl.getBySlug);

module.exports = router;
