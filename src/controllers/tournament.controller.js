// src/controllers/tournament.controller.js

import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Tournament } from '../models/tournament.model.js';

// createTournament, getAllTournaments, getTournamentBySlug functions remain here...
// ...

/**
 * @description Update a tournament's details (Admin only)
 * @route PATCH /api/tournaments/:slug
 * @access Private (Admin)
 */
const updateTournament = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const updateData = req.body;

    // Note: In a real app, if a new posterImage is uploaded (req.file),
    // you would first upload it to a cloud service, get the new URL,
    // delete the old image from the cloud, and then add the new URL to updateData.
    if (req.file) {
        // For now, we'll just log it. Replace with cloud upload logic.
        console.log("New poster image received:", req.file.path);
        // updateData.posterImage = newImageUrlFromCloud;
    }
    
    const tournament = await Tournament.findOneAndUpdate(
        { slug },
        { $set: updateData },
        { new: true } // This option returns the updated document
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
 * @route DELETE /api/tournaments/:slug
 * @access Private (Admin)
 */
const deleteTournament = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const tournament = await Tournament.findOneAndDelete({ slug });

    if (!tournament) {
        throw new ApiError(404, "Tournament not found");
    }

    // Note: In a real app, you would also delete the associated
    // posterImage from your cloud storage service here.

    return res.status(200).json(
        new ApiResponse(200, {}, "Tournament deleted successfully")
    );
});

export {
    createTournament,
    getAllTournaments,
    getTournamentBySlug,
    updateTournament, // Add new function to exports
    deleteTournament  // Add new function to exports
};