// src/routes/tournament.routes.js

import { Router } from 'express';
import {
    createTournament,
    getAllTournaments,
    getTournamentBySlug,
    updateTournament,
    deleteTournament
} from '../controllers/tournament.controller.js';
import { verifyJWT, isAdmin } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

// --- Public Routes ---
router.route("/").get(getAllTournaments);

// --- THIS IS THE FIX ---
// Dedicated public route to get a single tournament by its unique slug.
// This matches the URL that td.html is trying to call.
router.route("/slug/:slug").get(getTournamentBySlug);


// --- Admin-Only Routes ---

// Route to create a new tournament
router.route("/").post(
    verifyJWT,
    isAdmin,
    upload.single('posterImage'),
    createTournament
);

// Route for updating and deleting a tournament by its slug
router.route("/:slug")
    .patch(
        verifyJWT,
        isAdmin,
        upload.single('posterImage'),
        updateTournament
    )
    .delete(
        verifyJWT,
        isAdmin,
        deleteTournament
    );

export default router;