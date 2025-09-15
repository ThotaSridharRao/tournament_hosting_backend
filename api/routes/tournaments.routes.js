// src/routes/tournament.routes.js

import { Router } from 'express';
import {
    createTournament,
    getAllTournaments,
    getTournamentBySlug,
    updateTournament, // Import new function
    deleteTournament  // Import new function
} from '../controllers/tournament.controller.js';
import { verifyJWT, isAdmin } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

// --- Public Routes ---
router.route("/")
    .get(getAllTournaments);

// --- Admin-Only Routes ---
router.route("/")
    .post(
        verifyJWT,
        isAdmin,
        upload.single('posterImage'),
        createTournament
    );

// Combined route for single tournament operations
router.route("/:slug")
    .get(getTournamentBySlug)
    .patch( // UPDATE route
        verifyJWT,
        isAdmin,
        upload.single('posterImage'),
        updateTournament
    )
    .delete( // DELETE route
        verifyJWT,
        isAdmin,
        deleteTournament
    );

export default router;