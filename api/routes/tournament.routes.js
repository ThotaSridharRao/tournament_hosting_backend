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

// Public routes
router.get("/", getAllTournaments);
router.get("/slug/:slug", getTournamentBySlug);

// Admin routes
router.post(
  "/",
  verifyJWT,
  isAdmin,
  upload.single("posterImage"),
  createTournament
);

router.patch(
  "/:slug",
  verifyJWT,
  isAdmin,
  upload.single("posterImage"),
  updateTournament
);

router.delete(
  "/:slug",
  verifyJWT,
  isAdmin,
  deleteTournament
);

export default router;
