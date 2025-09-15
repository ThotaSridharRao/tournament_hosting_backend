import { Router } from 'express';
import {
    scheduleMatch,
    getTournamentMatches,
    updateMatchResult
} from '../controllers/match.controller.js';
import { verifyJWT, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// --- Public Route ---
// Anyone can view the matches for a tournament
router.route("/:slug").get(getTournamentMatches);


// --- Admin-Only Routes ---
// Only admins can schedule a new match
router.route("/:slug").post(verifyJWT, isAdmin, scheduleMatch);

// Only admins can update a match result
router.route("/:matchId/result").patch(verifyJWT, isAdmin, updateMatchResult);


export default router;