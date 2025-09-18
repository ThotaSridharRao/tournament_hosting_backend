import mongoose from "mongoose";
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Team } from '../models/team.model.js';
import { Tournament } from '../models/tournament.model.js';
import { Player } from '../models/player.model.js';
import { ActivityLogger } from './activity.controller.js';

/**
 * @description Register a team for a specific tournament with detailed player information.
 * @route POST /api/tournaments/:slug/register
 * @access Private (Requires user to be logged in)
 */
const registerTeamForTournament = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { teamName, players, teamTag, teamDescription, acceptTerms } = req.body;
  const captainId = req.user?._id;

  if (!teamName || !players || !Array.isArray(players) || players.length === 0) {
    throw new ApiError(400, "Team name and player information are required");
  }

  if (!acceptTerms) {
    throw new ApiError(400, "You must accept the terms and conditions");
  }

  const tournament = await Tournament.findOne({ slug });
  if (!tournament) {
    throw new ApiError(404, "Tournament not found");
  }

  const maxPlayers = tournament.kpSettings?.maxPlayersPerTeam || 4;
  if (players.length > maxPlayers) {
    throw new ApiError(
      400,
      `A maximum of ${maxPlayers} players are allowed per team.`
    );
  }

  const now = new Date();
  const regStart = new Date(tournament.registrationStart);
  const regEnd = new Date(tournament.registrationEnd);

  if (now < regStart || now > regEnd) {
    throw new ApiError(400, "Registration for this tournament is not currently open.");
  }

  if (tournament.participants.length >= tournament.maxTeams) {
    throw new ApiError(400, "This tournament is full.");
  }

  // Start a transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check for duplicate team name
    const existingTeam = await Team.findOne({
      name: teamName,
      tournament: tournament._id,
    }).session(session);

    if (existingTeam) {
      throw new ApiError(409, "A team with this name already exists in this tournament.");
    }

    // Check for duplicate players
    for (const player of players) {
      const existingPlayer = await Player.findOne({
        email: player.email,
        tournament: tournament._id,
      }).session(session);

      if (existingPlayer) {
        throw new ApiError(
          409,
          `A player with the email ${player.email} is already registered in this tournament.`
        );
      }
    }

    // Create team
    const [newTeam] = await Team.create(
      [
        {
          name: teamName,
          tag: teamTag,
          description: teamDescription,
          tournament: tournament._id,
          captain: captainId,
          members: [captainId],
          status: "pending",
        },
      ],
      { session }
    );

    // Create players
    const playerDocs = [];
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      const isCaptain = i === 0;

      const [newPlayer] = await Player.create(
        [
          {
            name: p.name,
            inGameId: p.inGameId,
            phoneNumber: p.phoneNumber,
            email: p.email,
            team: newTeam._id,
            tournament: tournament._id,
            user: isCaptain ? captainId : null,
            isCaptain,
          },
        ],
        { session }
      );

      playerDocs.push(newPlayer._id);
    }

    newTeam.players = playerDocs;
    await newTeam.save({ session });

    tournament.participants.push(newTeam._id);
    await tournament.save({ session });

    await ActivityLogger.teamRegistered(newTeam, tournament, req.user);

    await session.commitTransaction();
    session.endSession();

    const populatedTeam = await Team.findById(newTeam._id).populate("players");

    return res
      .status(201)
      .json(
        new ApiResponse(201, { team: populatedTeam }, "Team registered successfully!")
      );
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    if (err.code === 11000) {
      throw new ApiError(409, "Duplicate key error (team or player already exists)");
    }

    throw err;
  }
});

/**
 * @description Get all teams for a specific tournament (Admin only)
 * @route GET /api/teams/:slug/admin
 * @access Private (Admin)
 */
const getTournamentTeams = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const tournament = await Tournament.findOne({ slug });
  if (!tournament) {
    throw new ApiError(404, "Tournament not found");
  }

  const teams = await Team.find({ tournament: tournament._id })
    .populate("captain", "username email")
    .populate("players");

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

  if (!["approved", "rejected"].includes(status)) {
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

/**
 * @description Auto-approve team registration for testing purposes
 * @route PATCH /api/teams/:teamId/approve-testing
 * @access Private (Team Captain)
 */
const approveTeamForTesting = asyncHandler(async (req, res) => {
  const { teamId } = req.params;

  const team = await Team.findById(teamId);
  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  // Check if the user is the team captain
  if (team.captain.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only team captain can approve team for testing");
  }

  // Update team status to approved for testing
  team.status = "approved";
  await team.save();

  const populatedTeam = await Team.findById(team._id)
    .populate("captain", "username email")
    .populate("players");

  return res
    .status(200)
    .json(
      new ApiResponse(200, populatedTeam, "Team approved for testing successfully")
    );
});

export {
  registerTeamForTournament,
  getTournamentTeams,
  updateTeamStatus,
  approveTeamForTesting,
};
