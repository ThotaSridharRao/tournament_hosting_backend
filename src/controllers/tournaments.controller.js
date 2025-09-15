// src/controllers/tournaments.controller.js
const Tournament = require('../models/tournament.model');

// GET /api/tournaments
exports.list = async (req, res, next) => {
  try {
    const tournaments = await Tournament.find().sort({ tournamentStart: 1 });
    res.json({ success: true, data: tournaments });
  } catch (err) {
    next(err);
  }
};

// GET /api/tournaments/:slug
exports.getBySlug = async (req, res, next) => {
  try {
    const tournament = await Tournament.findOne({ slug: req.params.slug }).populate('teams');
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    res.json({ success: true, data: tournament });
  } catch (err) {
    next(err);
  }
};

// GET /api/tournaments/featured
exports.featured = async (req, res, next) => {
  try {
    const featured = await Tournament.find().sort({ prizePool: -1 }).limit(3);
    res.json({ success: true, data: featured });
  } catch (err) {
    next(err);
  }
};

// GET /api/tournaments/stats
exports.stats = async (req, res, next) => {
  try {
    const totalTournaments = await Tournament.countDocuments();
    const agg = await Tournament.aggregate([
      { $group: { _id: null, totalPrize: { $sum: "$prizePool" } } }
    ]);
    const totalPrizePool = agg[0]?.totalPrize || 0;
    
    // TODO: Replace with real user/player count from User model
    const activePlayers = 15420; // Mock data for now

    res.json({
      success: true,
      data: { 
        totalTournaments, 
        totalPrizePool,
        activePlayers
      }
    });
  } catch (err) {
    next(err);
  }
};
