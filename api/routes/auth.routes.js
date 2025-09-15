// src/routes/auth.routes.js

import { Router } from 'express';
import {
    registerUser,
    loginUser,
    logoutUser
} from '../controllers/auth.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// --- Public Routes ---
// These endpoints do not require authentication
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);


// --- Secured Routes ---
// This endpoint requires a valid JWT to be sent in the request header
router.route("/logout").post(verifyJWT, logoutUser);


export default router;