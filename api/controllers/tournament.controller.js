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

    // --- CHANGE: Automatically generate a slug from the title ---
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
        .trim()
        .replace(/\s+/g, '-'); // Replace spaces with hyphens

    // Check if a tournament with this slug already exists to ensure uniqueness
    const existingTournament = await Tournament.findOne({ slug });
    if (existingTournament) {
        throw new ApiError(409, `A tournament with the name "${title}" already exists.`);
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
        slug // --- ADDED: Save the generated slug to the database ---
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

/**
 * @description Update a tournament's details (Admin only)
 */
const updateTournament = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const updateData = req.body;

    if (req.file) {
        // In a real app, you would handle cloud upload here
        // updateData.posterImage = newImageUrlFromCloud;
    }
    
    // If the title is being updated, regenerate the slug
    if (updateData.title) {
        updateData.slug = updateData.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');
    }

    const tournament = await Tournament.findOneAndUpdate(
        { slug },
        { $set: updateData },
        { new: true }
    );

    if (!tournament) {
        throw new ApiError(404, "Tournament not found");
    }

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