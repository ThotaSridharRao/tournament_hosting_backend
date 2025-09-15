// src/app.js

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();

// Trust the Render proxy (important for rate limiting and IP detection)
app.set('trust proxy', 1);

// --- Global Middleware ---

// Set security-related HTTP headers
app.use(helmet());

// Rate limiter with proper proxy configuration
// Enable Cross-Origin Resource Sharing (CORS)
// This is essential because our frontend and backend run on different ports/domains.
app.use(cors({
    origin: process.env.CORS_ORIGIN, // We will add this to our .env file
    credentials: true
}));

// Limit repeated requests to the API to prevent brute-force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  }
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window (15 minutes)
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter);

// Built-in middleware to parse incoming JSON request bodies
app.use(express.json({ limit: "16kb" }));

// Built-in middleware to parse incoming URL-encoded request bodies
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Middleware to serve static files (like uploaded images) from the 'public' directory
app.use(express.static("src/public"));


// --- Route Imports (we will create these files next) ---
import authRouter from './routes/auth.routes.js';
import tournamentRouter from './routes/tournament.routes.js';
import teamRouter from './routes/team.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';
import userRouter from './routes/user.routes.js';        
import matchRouter from './routes/match.routes.js';
// --- Routes Declaration ---
// This tells the app to use the authRouter for any requests starting with '/api/auth'
app.use("/api/auth", authRouter);
app.use("/api/tournaments", tournamentRouter);
app.use("/api/teams", teamRouter);
app.use("/api/dashboard", dashboardRouter); // MOUNT THE NEW ROUTER
app.use("/api/users", userRouter);             
app.use("/api/matches", matchRouter); // MOUNT THE NEW ROUTER

// Export the configured app to be used in src/index.js
export { app };