import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Tournament } from '../models/tournament.model.js';

/**
 * @description Create a new tournament (Admin only)
 */
const createTournament = asyncHandler(async (req, res) => {
    const { title, description, game, prizePool, maxTeams, registrationStart, registrationEnd, tournamentStart, tournamentEnd, entryFee, format } = req.body;

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

    const tournament = await Tournament.create({
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
        posterImage: posterImageUrl, // 3. Save the full URL to the database
        status: 'upcoming' // Default status
    });

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
    const { teamName, players } = req.body;

    if (!teamName || !players || !Array.isArray(players) || players.length === 0) {
        throw new ApiError(400, "Team name and players information are required");
    }

    if (players.length > 4) {
        throw new ApiError(400, "Maximum 4 players allowed per team");
    }

    const tournament = await Tournament.findOne({ slug });
    if (!tournament) {
        throw new ApiError(404, "Tournament not found");
    }

    // Check if tournament is accepting registrations
    if (tournament.status !== 'registration') {
        throw new ApiError(400, "Tournament registration is not open");
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
        members: req.user._id 
    });
    if (userInTeam) {
        throw new ApiError(409, "You are already registered in a team for this tournament");
    }

    // Validate player data
    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        if (!player.name || !player.inGameId || !player.phoneNumber || !player.email) {
            throw new ApiError(400, `All fields are required for player ${i + 1}`);
        }

        // Check for duplicate emails and phone numbers in this tournament
        const existingPlayer = await Player.findOne({
            tournament: tournament._id,
            $or: [
                { email: player.email },
                { phoneNumber: player.phoneNumber }
            ]
        });

        if (existingPlayer) {
            throw new ApiError(409, `Player with email ${player.email} or phone ${player.phoneNumber} is already registered in this tournament`);
        }
    }

    // Calculate total amount
    const totalAmount = tournament.entryFee || 0;

    // Create the team first
    const team = await Team.create({
        name: teamName,
        tournament: tournament._id,
        captain: req.user._id,
        members: [req.user._id],
        totalAmount,
        status: 'pending' // Pending until payment is completed
    });

    // Create player records
    const playerRecords = [];
    for (let i = 0; i < players.length; i++) {
        const playerData = players[i];
        const player = await Player.create({
            name: playerData.name,
            inGameId: playerData.inGameId,
            phoneNumber: playerData.phoneNumber,
            email: playerData.email,
            team: team._id,
            tournament: tournament._id,
            user: i === 0 ? req.user._id : null, // First player is the captain/user
            isCaptain: i === 0
        });
        playerRecords.push(player._id);
    }

    // Update team with player references
    team.players = playerRecords;
    await team.save();

    // Add team to tournament participants
    tournament.participants.push(team._id);
    await tournament.save();

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
 * @description Get all teams for a tournament
 */
const getTeamsForTournament = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const tournament = await Tournament.findOne({ slug });
    if (!tournament) {
        throw new ApiError(404, "Tournament not found");
    }

    const { Team } = await import('../models/team.model.js');
    
    const teams = await Team.find({ tournament: tournament._id })
        .populate('captain', 'username email')
        .populate('members', 'username email');

    return res.status(200).json(
        new ApiResponse(200, teams, "Teams fetched successfully")
    );
});

/**
 * @description Cancel a tournament (Admin only) - Sets status to cancelled
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

export {
    createTournament,
    getAllTournaments,
    getTournamentBySlug,
    updateTournament,
    deleteTournament,
    cancelTournament,
    registerTeamForTournament,
    getTeamsForTournament
};