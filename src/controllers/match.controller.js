import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Match } from '../models/match.model.js';
import { Tournament } from '../models/tournament.model.js';

/**
 * @description Schedule a new match for a tournament (Admin only)
 * @route POST /api/matches/:slug
 * @access Private (Admin)
 */
const scheduleMatch = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const { teams, startTime } = req.body; // Expecting an array of Team IDs

    // 1. Find the tournament
    const tournament = await Tournament.findOne({ slug });
    if (!tournament) {
        throw new ApiError(404, "Tournament not found");
    }

    // 2. Validate inputs
    if (!teams || !Array.isArray(teams) || teams.length === 0 || !startTime) {
        throw new ApiError(400, "Team IDs and a start time are required to schedule a match.");
    }

    // 3. Create the new match
    const match = await Match.create({
        tournament: tournament._id,
        teams,
        startTime
    });

    return res.status(201).json(
        new ApiResponse(201, match, "Match scheduled successfully")
    );
});

/**
 * @description Get all matches for a specific tournament
 * @route GET /api/matches/:slug
 * @access Public
 */
const getTournamentMatches = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const tournament = await Tournament.findOne({ slug });
    if (!tournament) {
        throw new ApiError(404, "Tournament not found");
    }

    const matches = await Match.find({ tournament: tournament._id })
        .sort({ startTime: 'asc' }) // Show earliest matches first
        .populate("teams", "name") // Replace team IDs with their names
        .populate("result.winner", "name"); // If there's a winner, show their name

    return res.status(200).json(
        new ApiResponse(200, matches, "Tournament matches fetched successfully")
    );
});

/**
 * @description Update the result of a completed match (Admin only)
 * @route PATCH /api/matches/:matchId/result
 * @access Private (Admin)
 */
const updateMatchResult = asyncHandler(async (req, res) => {
    const { matchId } = req.params;
    const { winner, score } = req.body; // Expecting a winning Team ID and a score string

    if (!winner || !score) {
        throw new ApiError(400, "A winner and score are required to update the result.");
    }

    const updatedMatch = await Match.findByIdAndUpdate(
        matchId,
        {
            $set: {
                status: 'completed',
                result: {
                    winner,
                    score
                }
            }
        },
        { new: true }
    );

    if (!updatedMatch) {
        throw new ApiError(404, "Match not found");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedMatch, "Match result updated successfully")
    );
});

export {
    scheduleMatch,
    getTournamentMatches,
    updateMatchResult
};