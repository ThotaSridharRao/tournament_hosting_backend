// src/routes/bracket.routes.js
import { Router } from 'express';
import {
    getTournamentBrackets,
    initializeTournamentBrackets,
    startRound,
    completeRound,
    recordPayment,
    getPaymentSummary,
    updateTeamStatus
} from '../controllers/bracket.controller.js';
import { verifyJWT, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Get tournament brackets
router.get(
    "/:tournamentId/brackets",
    verifyJWT,
    getTournamentBrackets
);

// Initialize tournament brackets (Admin only)
router.post(
    "/:tournamentId/brackets",
    verifyJWT,
    isAdmin,
    initializeTournamentBrackets
);

// Start a round (Admin only)
router.post(
    "/:tournamentId/brackets/round/:roundKey/start",
    verifyJWT,
    isAdmin,
    startRound
);

// Complete a round (Admin only)
router.post(
    "/:tournamentId/brackets/round/:roundKey/complete",
    verifyJWT,
    isAdmin,
    completeRound
);

// Record payment
router.post(
    "/:tournamentId/brackets/payment",
    verifyJWT,
    recordPayment
);

// Get payment summary (Admin only)
router.get(
    "/:tournamentId/brackets/payments",
    verifyJWT,
    isAdmin,
    getPaymentSummary
);

// Update team status (Admin only)
router.patch(
    "/:tournamentId/brackets/team/:teamId",
    verifyJWT,
    isAdmin,
    updateTeamStatus
);

export default router;