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



    const posterImagePath = req.file?.path;

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
        posterImage: posterImagePath || '',
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
    const updateData = { ...req.body };

    // This builds and saves a complete, correct URL
    // In createTournament and updateTournament in the controller
    if (req.file) {
        // Remove the internal directory path to get the correct public path
        const imagePath = req.file.path.replace('api/public/', '');

        // Construct the full, correct URL
        const posterUrl = `${req.protocol}://${req.get('host')}/${imagePath}`;
        req.body.posterImage = posterUrl;
    }
    // Find tournament by old slug first
    const tournament = await Tournament.findOne({ slug });
    if (!tournament) {
        throw new ApiError(404, "Tournament not found");
    }

    // Apply updates
    Object.assign(tournament, updateData);
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