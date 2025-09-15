import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();

// --- Global Middleware ---

// Trust the first proxy in front of the app (important for platforms like Render)
app.set('trust proxy', 1);

// Set security-related HTTP headers
app.use(helmet());

// Enable Cross-Origin Resource Sharing (CORS) with credentials
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

// Limit repeated requests to the API to prevent brute-force attacks
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { // Send a JSON response when the limit is exceeded
        success: false,
        error: 'Too many requests from this IP, please try again after 15 minutes.'
    }
});
app.use(limiter);

// Built-in middleware to parse incoming JSON request bodies
app.use(express.json({ limit: "16kb" }));

// Built-in middleware to parse incoming URL-encoded request bodies
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Middleware to serve static files from the 'public' directory
app.use(express.static("src/public"));


// --- Route Imports ---
import authRouter from './routes/auth.routes.js';
import tournamentRouter from './routes/tournament.routes.js';
import teamRouter from './routes/team.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';
import userRouter from './routes/user.routes.js';
import matchRouter from './routes/match.routes.js';

// --- Routes Declaration ---
app.use("/api/auth", authRouter);
app.use("/api/tournaments", tournamentRouter);
app.use("/api/teams", teamRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/users", userRouter);
app.use("/api/matches", matchRouter);

// Export the configured app to be used in src/index.js
export { app };