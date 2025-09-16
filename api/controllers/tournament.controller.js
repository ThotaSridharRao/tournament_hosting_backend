import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Tournament } from '../models/tournament.model.js';

/**
 * @description Create a new tournament (Admin only)
 */
const createTournament = asyncHandler(async (req, res) => {
    const { title, description, game, prizePool, maxTeams, registrationStart, registrationEnd, tournamentStart, tournamentEnd } = req.body;

    if (!title || !description || !game || !maxTeams || !registrationStart || !registrationEnd || !tournamentStart || !tournamentEnd) {
        throw new ApiError(400, "All required fields must be provided");
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
        maxTeams: Number(maxTeams),
        registrationStart,
        registrationEnd,
        tournamentStart,
        tournamentEnd,
        organizer: req.user._id,
        posterImage: posterImageUrl, // 3. Save the full URL to the database
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

    const tournament = await Tournament.findOne({ slug }).populate("organizer", "username");

    if (!tournament) {
        throw new ApiError(404, "Tournament not found");
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
 * @description Delete a tournament (Admin only)
 */
const deleteTournament = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const tournament = await Tournament.findOneAndDelete({ slug });

    if (!tournament) {
        throw new ApiError(404, "Tournament not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Tournament deleted successfully")
    );
});


export {
    createTournament,
    getAllTournaments,
    getTournamentBySlug,
    updateTournament,
    deleteTournament
};