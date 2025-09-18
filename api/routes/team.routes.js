// src/routes/team.routes.js

import { Router } from 'express';
import {
    getTournamentTeams,
    updateTeamStatus,
    approveTeamForTesting,
} from '../controllers/team.controller.js';
import { verifyJWT, isAdmin } from '../middlewares/auth.middleware.js';
import { Team } from '../models/team.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

const router = Router();

// Get individual team details
router.get(
    "/:teamId",
    verifyJWT,
    asyncHandler(async (req, res) => {
        const team = await Team.findById(req.params.teamId)
            .populate("captain", "username email")
            .populate("players") // ✅ Added players population
            .populate("tournament", "title slug");

        if (!team) {
            throw new ApiError(404, "Team not found");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, team, "Team fetched successfully"));
    })
);

// --- Testing Routes ---
router.patch("/:teamId/approve-testing", verifyJWT, approveTeamForTesting);

// --- Admin Routes (Secured) ---
router.get("/:slug/admin", verifyJWT, isAdmin, getTournamentTeams);
router.patch("/:teamId/status", verifyJWT, isAdmin, updateTeamStatus);

export default router;
