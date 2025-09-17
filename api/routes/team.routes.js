// src/routes/team.routes.js

import { Router } from 'express';
import { 
    registerTeamForTournament,
    getTournamentTeams,  // Import new function
    updateTeamStatus     // Import new function
} from '../controllers/team.controller.js';
import { verifyJWT, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// --- User Routes (Secured) ---
router.route("/register/:slug").post(verifyJWT, registerTeamForTournament);

// Get individual team details
router.route("/:teamId").get(verifyJWT, async (req, res) => {
    try {
        const { Team } = await import('../models/team.model.js');
        const team = await Team.findById(req.params.teamId)
            .populate('captain', 'username email')
            .populate('tournament', 'title slug');
        
        if (!team) {
            return res.status(404).json({ success: false, message: "Team not found" });
        }
        
        res.json({ success: true, data: team });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- Admin Routes (Secured) ---
router.route("/:slug/admin").get(verifyJWT, isAdmin, getTournamentTeams);
router.route("/:teamId/status").patch(verifyJWT, isAdmin, updateTeamStatus);


export default router;