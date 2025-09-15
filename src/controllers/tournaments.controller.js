// src/controllers/tournaments.controller.js
const Tournament = require('../models/tournament.model');

exports.list = async (req, res, next) => {
  try {
    const tournaments = await Tournament.find().sort({ tournamentStart: 1 });
    res.json({ success: true, data: tournaments });
  } catch (err) {
    next(err);
  }
};

exports.getBySlug = async (req, res, next) => {
  try {
    const tournament = await Tournament.findOne({ slug: req.params.slug }).populate('teams');
    if (!tournament) return res.status(404).json({ success: false, error: 'Tournament not found' });
    res.json({ success: true, data: tournament });
  } catch (err) {
    next(err);
  }
};
