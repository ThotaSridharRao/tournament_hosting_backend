const express = require('express');
const router = express.Router();
const matchesCtrl = require('../controllers/matches.controller');

router.get('/recent', matchesCtrl.recent);
router.get('/live', matchesCtrl.live);
router.get('/upcoming', matchesCtrl.upcoming);

module.exports = router;
