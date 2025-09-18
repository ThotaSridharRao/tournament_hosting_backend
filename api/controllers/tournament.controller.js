import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Tournament } from '../models/tournament.model.js';
import { ActivityLogger } from './activity.controller.js';

/**
 * @description Create a new tournament (Admin only)
 */
const createTournament = asyncHandler(async (req, res) => {
    const { title, description, game, prizePool, maxTeams, registrationStart, registrationEnd, tournamentStart, tournamentEnd, entryFee, format, groupSize, numberOfGroups, qualifiersPerGroup, maxPlayersPerTeam } = req.body;

    // Log the received data for debugging
    console.log('Tournament creation request body:', req.body);
    console.log('File uploaded:', req.file ? req.file.filename : 'No file');

    // Check for missing required fields with specific messages
    const missingFields = [];
    if (!title) missingFields.push('title');
    if (!description) missingFields.push('description');
    if (!game) missingFields.push('game');
    if (!maxTeams) missingFields.push('maxTeams');
    if (!registrationStart) missingFields.push('registrationStart');
    if (!registrationEnd) missingFields.push('registrationEnd');
    if (!tournamentStart) missingFields.push('tournamentStart');
    if (!tournamentEnd) missingFields.push('tournamentEnd');

    if (missingFields.length > 0) {
        throw new ApiError(400, `Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate dates
    const regStart = new Date(registrationStart);
    const regEnd = new Date(registrationEnd);
    const tournStart = new Date(tournamentStart);
    const tournEnd = new Date(tournamentEnd);
    const now = new Date();

    // Check for invalid dates
    if (isNaN(regStart.getTime())) {
        throw new ApiError(400, "Invalid registration start date");
    }
    if (isNaN(regEnd.getTime())) {
        throw new ApiError(400, "Invalid registration end date");
    }
    if (isNaN(tournStart.getTime())) {
        throw new ApiError(400, "Invalid tournament start date");
    }
    if (isNaN(tournEnd.getTime())) {
        throw new ApiError(400, "Invalid tournament end date");
    }

    // Validate date logic (allow past dates for testing purposes)
    if (regEnd <= regStart) {
        throw new ApiError(400, "Registration end date must be after registration start date");
    }
    if (tournStart < regEnd) {
        throw new ApiError(400, "Tournament start date must be after registration end date");
    }
    if (tournEnd <= tournStart) {
        throw new ApiError(400, "Tournament end date must be after tournament start date");
    }

    // Validate maxTeams
    const maxTeamsNum = Number(maxTeams);
    if (isNaN(maxTeamsNum) || maxTeamsNum < 2) {
        throw new ApiError(400, "Max teams must be a number greater than 1");
    }

    let posterImageUrl = ''; // Initialize a variable for the final URL

    // Check if a file was uploaded with the request
    if (req.file) {
        // 1. Clean the file path provided by multer.
        //    (e.g., 'api\\public\\temp\\image.jpg' becomes 'temp/image.jpg')
        const imagePath = req.file.path.replace('api/public/', '').replace(/\\/g, '/');

        // 2. Construct the full, public-facing URL.
        posterImageUrl = `${req.protocol}://${req.get('host')}/${imagePath}`;
    }

    // Prepare tournament data
    const tournamentData = {
        title,
        description,
        game,
        prizePool: Number(prizePool) || 0,
        maxTeams: maxTeamsNum,
        registrationStart,
        registrationEnd,
        tournamentStart,
        tournamentEnd,
        entryFee: Number(entryFee) || 0,
        format: format || 'single-elimination',
        organizer: req.user._id,
        posterImage: posterImageUrl,
        status: 'upcoming'
    };

    // Add KP settings if format is KP
    if (format === 'kp') {
        tournamentData.kpSettings = {
            groupSize: Number(groupSize) || 25,
            numberOfGroups: Number(numberOfGroups) || 4,
            qualifiersPerGroup: Number(qualifiersPerGroup) || 4,
            maxPlayersPerTeam: Number(maxPlayersPerTeam) || 4
        };
    }

    const tournament = await Tournament.create(tournamentData);

    // Log tournament creation activity
    await ActivityLogger.tournamentCreated(tournament, req.user);

    return res.status(201).json(
        new ApiResponse(201, tournament, "Tournament created successfully")
    );
});

/**
 * @description Get all tournaments with filtering and pagination
 */
const getAllTournaments = asyncHandler(async (req, res) => {
    const { status, game } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (game) filter.game = game;

    const tournaments = await Tournament.find(filter).populate("organizer", "username");

    return res.status(200).json(
        new ApiResponse(200, tournaments, "Tournaments fetched successfully")
    );
});

/**
 * @description Get a single tournament by its slug
 */
const getTournamentBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const tournament = await Tournament.findOne({ slug })
        .populate("organizer", "username")
        .populate({
            path: "participants",
            populate: [
                {
                    path: "captain",
                    select: "username email"
                },
                {
                    path: "players",
                    select: "name inGameId phoneNumber email isCaptain"
                }
            ]
        });

    if (!tournament) {
        throw new ApiError(404, "Tournament not found");
    }

    // Calculate and update tournament status based on current date
    const now = new Date();
    let newStatus = tournament.status;

    if (tournament.status === 'upcoming' && now >= tournament.registrationStart && now <= tournament.registrationEnd) {
        newStatus = 'registration';
    } else if ((tournament.status === 'upcoming' || tournament.status === 'registration') && now >= tournament.tournamentStart && now <= tournament.tournamentEnd) {
        newStatus = 'live';
    } else if ((tournament.status === 'upcoming' || tournament.status === 'registration' || tournament.status === 'live') && now > tournament.tournamentEnd) {
        newStatus = 'completed';
    }

    // Update status if it changed
    if (newStatus !== tournament.status) {
        tournament.status = newStatus;
        await tournament.save();
    }

    return res.status(200).json(
        new ApiResponse(200, tournament, "Tournament fetched successfully")
    );
});


const updateTournament = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    // Find the tournament by its current slug before doing anything else
    const tournament = await Tournament.findOne({ slug });
    if (!tournament) {
        throw new ApiError(404, "Tournament not found");
    }

    // Check if a new file was uploaded and add its full URL to req.body
    if (req.file) {
        // Clean the file path to get the correct public-facing path
        const imagePath = req.file.path.replace('api/public/', '').replace(/\\/g, '/');

        // Construct the full, public-facing URL
        const posterUrl = `${req.protocol}://${req.get('host')}/${imagePath}`;

        // Add the new URL to req.body so it gets applied
        req.body.posterImage = posterUrl;
    }

    // Apply all updates from the request body
    Object.assign(tournament, req.body);

    // Save the updated tournament
    await tournament.save();

    return res.status(200).json(
        new ApiResponse(200, tournament, "Tournament updated successfully")
    );
});

/**
 * @description Delete a tournament (Admin only) - Cascades to delete all related data
 */
const deleteTournament = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const tournament = await Tournament.findOne({ slug });
    if (!tournament) {
        throw new ApiError(404, "Tournament not found");
    }

    // Import Team model to delete related teams
    const { Team } = await import('../models/team.model.js');

    // Delete all teams associated with this tournament
    await Team.deleteMany({ tournament: tournament._id });

    // Delete the tournament itself
    await Tournament.findByIdAndDelete(tournament._id);

    return res.status(200).json(
        new ApiResponse(200, {}, "Tournament and all related data deleted successfully")
    );
});


/**
 * @description Register a team for a tournament with detailed player information
 */
const registerTeamForTournament = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const { teamName, players, teamTag, teamDescription, acceptTerms } = req.body;

    if (!teamName || !players || !Array.isArray(players) || players.length === 0) {
        throw new ApiError(400, "Team name and players information are required");
    }

    if (!acceptTerms) {
        throw new ApiError(400, "You must accept the terms and conditions");
    }

    // Get max players per team from tournament settings
    const tournament = await Tournament.findOne({ slug });
    if (!tournament) {
        throw new ApiError(404, "Tournament not found");
    }

    const maxPlayers = tournament.format === 'kp' ? tournament.kpSettings?.maxPlayersPerTeam || 4 : 4;
    if (players.length > maxPlayers) {
        throw new ApiError(400, `Maximum ${maxPlayers} players allowed per team`);
    }

    // Check if tournament is accepting registrations
    const now = new Date();
    const regStart = new Date(tournament.registrationStart);
    const regEnd = new Date(tournament.registrationEnd);

    const isRegistrationOpen = now >= regStart && now <= regEnd;
    const validStatuses = ['registration', 'upcoming'];

    // Allow registration if status is valid OR if we're within registration dates
    if (!validStatuses.includes(tournament.status) && !isRegistrationOpen) {
        throw new ApiError(400, `Tournament registration is not open. Status: ${tournament.status}, Registration period: ${regStart.toDateString()} - ${regEnd.toDateString()}`);
    }

    // Auto-update tournament status if we're in registration period
    if (isRegistrationOpen && tournament.status === 'upcoming') {
        tournament.status = 'registration';
        await tournament.save();
    }

    // Check if tournament is full
    if (tournament.participants.length >= tournament.maxTeams) {
        throw new ApiError(400, "Tournament is full");
    }

    // Import models
    const { Team } = await import('../models/team.model.js');
    const { Player } = await import('../models/player.model.js');

    // Check if team name already exists in this tournament
    const existingTeam = await Team.findOne({ name: teamName, tournament: tournament._id });
    if (existingTeam) {
        throw new ApiError(409, "Team name already exists in this tournament");
    }

    // Check if user is already in a team for this tournament
    const userInTeam = await Team.findOne({
        tournament: tournament._id,
        $or: [
            { captain: req.user._id },
            { members: req.user._id }
        ]
    });
    if (userInTeam) {
        throw new ApiError(409, `You are already registered in team "${userInTeam.name}" for this tournament`);
    }

    // Validate player data
    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        if (!player.name || !player.inGameId || !player.email) {
            throw new ApiError(400, `Name, in-game ID, and email are required for player ${i + 1}`);
        }

        // Check for duplicate emails in this tournament
        const existingPlayer = await Player.findOne({
            tournament: tournament._id,
            email: player.email
        });

        if (existingPlayer) {
            throw new ApiError(409, `Player with email ${player.email} is already registered in this tournament`);
        }
    }

    // Calculate total amount
    const totalAmount = tournament.entryFee || 0;

    // Create the team first
    let team;
    try {
        team = await Team.create({
            name: teamName,
            tag: teamTag,
            description: teamDescription,
            tournament: tournament._id,
            captain: req.user._id,
            members: [req.user._id],
            totalAmount,
            status: 'pending' // Pending until payment is completed
        });
    } catch (error) {
        if (error.code === 11000) {
            // Handle duplicate key errors
            if (error.message.includes('name_1_tournament_1')) {
                throw new ApiError(409, `Team name "${teamName}" is already taken in this tournament`);
            }
            throw new ApiError(409, "A team with this information already exists in this tournament");
        }
        throw error;
    }

    // 🎯 NEW APPROACH: Handle complete team package
    console.log(`📦 Processing team package: ${teamName} with ${players.length} players`);
    
    // Validate exact number of players
    const expectedPlayers = maxPlayers;
    if (players.length !== expectedPlayers) {
        throw new ApiError(400, `This tournament requires exactly ${expectedPlayers} players. You provided ${players.length} players.`);
    }

    // Validate for duplicate emails within the team package
    const emailSet = new Set();
    const duplicateEmails = [];
    for (const player of players) {
        const normalizedEmail = player.email.toLowerCase();
        if (emailSet.has(normalizedEmail)) {
            duplicateEmails.push(player.email);
        } else {
            emailSet.add(normalizedEmail);
        }
    }
    
    if (duplicateEmails.length > 0) {
        throw new ApiError(400, `Duplicate emails found in your team: ${duplicateEmails.join(', ')}. Each player must have a unique email address.`);
    }

    // Create complete team package in one transaction
    const playerRecords = [];
    
    // Use transaction to ensure atomicity
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        // Create all players in one go
        for (let i = 0; i < players.length; i++) {
            const playerData = players[i];
            
            // Check if email already exists in tournament
            const existingPlayer = await Player.findOne({
                tournament: tournament._id,
                email: playerData.email.toLowerCase()
            }).session(session);
            
            if (existingPlayer) {
                throw new ApiError(409, `Player with email "${playerData.email}" is already registered in this tournament`);
            }
            
            const player = await Player.create([{
                name: playerData.name,
                inGameId: playerData.inGameId,
                phoneNumber: playerData.phoneNumber || '',
                email: playerData.email.toLowerCase(),
                team: team._id,
                tournament: tournament._id,
                user: i === 0 ? req.user._id : null, // First player is the captain
                isCaptain: i === 0
            }], { session });
            
            playerRecords.push(player[0]._id);
        }
        
        await session.commitTransaction();
        console.log(`✅ Successfully created team package with ${playerRecords.length} players`);
        
    } catch (error) {
        await session.abortTransaction();
        // Clean up the team if player creation failed
        await Team.findByIdAndDelete(team._id);
        throw error;
    } finally {
        session.endSession();
    }

    // Update team with player references
    team.players = playerRecords;
    await team.save();

    // Add team to tournament participants (check for duplicates first)
    if (!tournament.participants.includes(team._id)) {
        tournament.participants.push(team._id);
        await tournament.save();
    }

    const populatedTeam = await Team.findById(team._id)
        .populate('captain', 'username email')
        .populate('players');

    return res.status(201).json(
        new ApiResponse(201, {
            team: populatedTeam,
            paymentRequired: totalAmount > 0,
            totalAmount
        }, "Team registered successfully. Payment required to confirm registration.")
    );
});

/**
 * @description Cancel a tournament (Admin only)
 */
const cancelTournament = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const tournament = await Tournament.findOne({ slug });
    if (!tournament) {
        throw new ApiError(404, "Tournament not found");
    }

    if (tournament.status === 'completed') {
        throw new ApiError(400, "Cannot cancel a completed tournament");
    }

    tournament.status = 'cancelled';
    await tournament.save();

    return res.status(200).json(
        new ApiResponse(200, tournament, "Tournament cancelled successfully")
    );
});

/**
 * @description Get teams for a tournament
 */
const getTeamsForTournament = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const tournament = await Tournament.findOne({ slug }).populate({
        path: 'participants',
        populate: {
            path: 'captain players',
            select: 'username email name inGameId'
        }
    });

    if (!tournament) {
        throw new ApiError(404, "Tournament not found");
    }

    return res.status(200).json(
        new ApiResponse(200, tournament.participants, "Teams fetched successfully")
    );
});

/**
 * @description Get user's team for a specific tournament
 */
const getUserTeamForTournament = asyncHandler(async (req, res) => {
    const { tournamentId } = req.params;

    // Import Team model dynamically to avoid circular dependency
    const { Team } = await import('../models/team.model.js');

    // Find team where user is a member
    const team = await Team.findOne({
        tournament: tournamentId,
        members: req.user._id
    })
        .populate('captain', 'username email')
        .populate('players')
        .populate('tournament', 'title slug status');

    if (!team) {
        throw new ApiError(404, "No team found for this tournament");
    }

    return res.status(200).json(
        new ApiResponse(200, team, "Team fetched successfully")
    );
});

export {
    createTournament,
    getAllTournaments,
    getTournamentBySlug,
    updateTournament,
    deleteTournament,
    cancelTournament,
    registerTeamForTournament,
    getTeamsForTournament,
    getUserTeamForTournament
};