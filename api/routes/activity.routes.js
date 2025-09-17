import express from 'express';
import { 
    getRecentActivities, 
    getPlatformActivities, 
    getActivitiesByType,
    getTournamentActivities 
} from '../controllers/activity.controller.js';
import { verifyJWT, isAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Get recent activities (admin only)
router.get('/recent', verifyJWT, isAdmin, getRecentActivities);

// Get platform-wide activities (admin only)
router.get('/platform', verifyJWT, isAdmin, getPlatformActivities);

// Get activities by type (admin only)
router.get('/type/:type', verifyJWT, isAdmin, getActivitiesByType);

// Get tournament activities (admin only)
router.get('/tournament/:tournamentId', verifyJWT, isAdmin, getTournamentActivities);

export default router;