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


// --- Admin Routes (Secured) ---
router.route("/:slug/admin").get(verifyJWT, isAdmin, getTournamentTeams);
router.route("/:teamId/status").patch(verifyJWT, isAdmin, updateTeamStatus);


export default router;