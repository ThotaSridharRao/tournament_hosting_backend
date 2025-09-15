// src/controllers/team.controller.js

import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Team } from '../models/team.model.js';
import { Tournament } from '../models/tournament.model.js';

// The 'registerTeamForTournament' function remains here...
// ...

/**
 * @description Get all teams for a specific tournament (Admin only)
 * @route GET /api/teams/:slug/admin
 * @access Private (Admin)
 */
const getTournamentTeams = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    // Find the tournament to get its ID
    const tournament = await Tournament.findOne({ slug });
    if (!tournament) {
        throw new ApiError(404, "Tournament not found");
    }

    // Find all teams registered for this tournament's ID
    const teams = await Team.find({ tournament: tournament._id })
        .populate("captain", "username email") // Replace captain ID with username/email
        .populate("members", "username email"); // Replace member IDs with username/email

    return res.status(200).json(
        new ApiResponse(200, teams, "Tournament teams fetched successfully")
    );
});

/**
 * @description Update a team's registration status (Admin only)
 * @route PATCH /api/teams/:teamId/status
 * @access Private (Admin)
 */
const updateTeamStatus = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const { status } = req.body;

    // Validate that the new status is a valid option
    if (!['approved', 'rejected'].includes(status)) {
        throw new ApiError(400, "Invalid status provided");
    }

    const updatedTeam = await Team.findByIdAndUpdate(
        teamId,
        { $set: { status } },
        { new: true }
    );

    if (!updatedTeam) {
        throw new ApiError(404, "Team not found");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedTeam, "Team status updated successfully")
    );
});

export {
    registerTeamForTournament,
    getTournamentTeams, // Add new function to exports
    updateTeamStatus    // Add new function to exports
};