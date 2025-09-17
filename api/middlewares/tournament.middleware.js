// api/middlewares/tournament.middleware.js

import { Tournament } from '../models/tournament.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Middleware to automatically update tournament status based on current date
 */
export const updateTournamentStatus = asyncHandler(async (req, res, next) => {
    try {
        const now = new Date();
        
        // Update tournaments to 'registration' status
        await Tournament.updateMany(
            {
                status: 'upcoming',
                registrationStart: { $lte: now },
                registrationEnd: { $gte: now }
            },
            { status: 'registration' }
        );

        // Update tournaments to 'live' status
        await Tournament.updateMany(
            {
                status: { $in: ['upcoming', 'registration'] },
                tournamentStart: { $lte: now },
                tournamentEnd: { $gte: now }
            },
            { status: 'live' }
        );

        // Update tournaments to 'completed' status
        await Tournament.updateMany(
            {
                status: { $in: ['upcoming', 'registration', 'live'] },
                tournamentEnd: { $lt: now }
            },
            { status: 'completed' }
        );

        next();
    } catch (error) {
        console.error('Error updating tournament status:', error);
        next(); // Continue even if status update fails
    }
});