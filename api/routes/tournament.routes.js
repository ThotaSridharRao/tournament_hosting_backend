// src/routes/tournament.routes.js
import { Router } from 'express';
import {
  createTournament,
  getAllTournaments,
  getTournamentBySlug,
  updateTournament,
  deleteTournament,
  cancelTournament,
  registerTeamForTournament,
  getTeamsForTournament
} from '../controllers/tournament.controller.js';
import { verifyJWT, isAdmin } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';
import { updateTournamentStatus } from '../middlewares/tournament.middleware.js';

const router = Router();

// Public routes (with status update middleware)
router.get("/", updateTournamentStatus, getAllTournaments);
router.get("/slug/:slug", updateTournamentStatus, getTournamentBySlug);

// Admin routes
router.post(
  "/",
  verifyJWT,
  isAdmin,
  upload.single("posterImage"),
  createTournament
);

router.patch(
  "/:slug",
  verifyJWT,
  isAdmin,
  upload.single("posterImage"),
  updateTournament
);

router.delete(
  "/:slug",
  verifyJWT,
  isAdmin,
  deleteTournament
);

router.put(
  "/:slug/cancel",
  verifyJWT,
  isAdmin,
  cancelTournament
);

// Team registration routes
router.post(
  "/:slug/register",
  verifyJWT,
  registerTeamForTournament
);

router.get(
  "/:slug/teams",
  getTeamsForTournament
);

// Get team data for authenticated user
router.get(
  "/:tournamentId/team",
  verifyJWT,
  async (req, res) => {
    try {
      const { Team } = await import('../models/team.model.js');
      const team = await Team.findOne({ 
        tournament: req.params.tournamentId, 
        captain: req.user._id 
      }).populate('players');
      
      if (!team) {
        return res.status(404).json({ success: false, message: "Team not found" });
      }
      
      res.json({ success: true, data: team });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

export default router;
