import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Team } from '../models/team.model.js';
import { Tournament } from '../models/tournament.model.js';

/**
 * @description Register a team for a specific tournament.
 * @route POST /api/teams/register/:slug
 * @access Private (Requires user to be logged in)
 */
const registerTeamForTournament = asyncHandler(async (req, res) => {
    // 1. Get data from the request
    const { slug } = req.params;      // The tournament's unique slug from the URL
    const { name } = req.body;        // The desired team name from the form
    const captainId = req.user?._id;  // The logged-in user is the captain

    // 2. Validate input
    if (!name) {
        throw new ApiError(400, "Team name is required");
    }

    // 3. Find the tournament to ensure it exists
    const tournament = await Tournament.findOne({ slug });
    if (!tournament) {
        throw new ApiError(404, "Tournament not found");
    }

    // 4. CRUCIAL: Check if the tournament is open for registration
    if (tournament.status !== 'registration') {
        throw new ApiError(400, "Registration for this tournament is not currently open.");
    }

    // 5. CRUCIAL: Check if this user is already part of another team in this tournament
    const existingTeam = await Team.findOne({
        tournament: tournament._id,
        members: captainId // Check if user's ID is in any team's member list for this tournament
    });
    if (existingTeam) {
        throw new ApiError(409, "You are already on a team for this tournament.");
    }

    // 6. Create the new team document
    const team = await Team.create({
        name,
        tournament: tournament._id,
        captain: captainId,
        members: [captainId] // Automatically add the captain as the first member
    });

    // 7. Add the newly created team's ID to the tournament's list of participants
    await Tournament.findByIdAndUpdate(tournament._id, {
        $push: { participants: team._id }
    });

    // 8. Send a success response
    return res.status(201).json(
        new ApiResponse(201, team, "Team registered successfully")
    );
});


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
    getTournamentTeams,
    updateTeamStatus
};