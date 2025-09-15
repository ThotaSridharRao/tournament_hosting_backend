// src/controllers/dashboard.controller.js

import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Tournament } from '../models/tournament.model.js';
import { User } from '../models/user.model.js';
import { Team } from '../models/team.model.js';

/**
 * @description Get statistics for the admin dashboard
 * @route GET /api/dashboard/stats
 * @access Private (Admin)
 */
const getDashboardStats = asyncHandler(async (req, res) => {
    // We run all database queries in parallel for better performance
    const [totalUsers, totalTournaments, totalTeams, totalPrizePoolData] = await Promise.all([
        User.countDocuments(),
        Tournament.countDocuments(),
        Team.countDocuments(),
        // Use MongoDB Aggregation Pipeline to calculate the sum of the prize pool
        Tournament.aggregate([
            {
                $group: {
                    _id: null,
                    totalPrize: { $sum: "$prizePool" }
                }
            }
        ])
    ]);

    const stats = {
        totalUsers,
        totalTournaments,
        totalTeams,
        totalPrizePool: totalPrizePoolData[0]?.totalPrize || 0
    };

    return res.status(200).json(
        new ApiResponse(200, stats, "Dashboard statistics fetched successfully")
    );
});


/**
 * @description Get recent activity for the admin dashboard
 * @route GET /api/dashboard/activity
 * @access Private (Admin)
 */
const getRecentActivity = asyncHandler(async (req, res) => {
    // Fetch the 5 most recent documents from various collections
    const [recentUsers, recentTournaments, recentTeams] = await Promise.all([
        User.find().sort({ createdAt: -1 }).limit(5).select("username createdAt"),
        Tournament.find().sort({ createdAt: -1 }).limit(5).select("title createdAt"),
        Team.find().sort({ createdAt: -1 }).limit(5).select("name createdAt").populate("tournament", "title")
    ]);

    // Format the data into a unified activity feed structure
    const usersActivity = recentUsers.map(u => ({
        type: 'New User',
        text: `User '${u.username}' registered.`,
        timestamp: u.createdAt
    }));

    const tournamentsActivity = recentTournaments.map(t => ({
        type: 'New Tournament',
        text: `Tournament '${t.title}' was created.`,
        timestamp: t.createdAt
    }));
    
    const teamsActivity = recentTeams.map(t => ({
        type: 'New Registration',
        text: `Team '${t.name}' registered for '${t.tournament.title}'.`,
        timestamp: t.createdAt
    }));

    // Combine all activities, sort by timestamp, and take the 10 most recent
    const allActivities = [...usersActivity, ...tournamentsActivity, ...teamsActivity]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);

    return res.status(200).json(
        new ApiResponse(200, allActivities, "Recent activity fetched successfully")
    );
});


export {
    getDashboardStats,
    getRecentActivity
};