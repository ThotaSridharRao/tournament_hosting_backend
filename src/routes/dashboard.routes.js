// src/routes/dashboard.routes.js

import { Router } from 'express';
import {
    getDashboardStats,
    getRecentActivity
} from '../controllers/dashboard.controller.js';
import { verifyJWT, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// All routes in this file require admin access
router.use(verifyJWT, isAdmin);

// Define the routes
router.route("/stats").get(getDashboardStats);
router.route("/activity").get(getRecentActivity);

export default router;