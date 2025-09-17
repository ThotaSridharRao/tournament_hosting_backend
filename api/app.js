import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { ApiError } from "./utils/ApiError.js";

const app = express();

// --- Global Middleware ---

// Trust the first proxy in front of the app (important for Render/Heroku/etc.)
app.set("trust proxy", 1);

// Set security-related HTTP headers with CORS-friendly configuration
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// Define allowed origins for CORS
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:5502", // VSCode Live Server default
  "http://127.0.0.1:5500", // Alternate Live Server port
  "http://127.0.0.1:5501", // Another Live Server port
  "http://localhost:5500",
  "http://localhost:5501",
  "http://localhost:5502",
  process.env.CORS_ORIGIN, // Your deployed frontend (set in .env)
];

// Enable Cross-Origin Resource Sharing (CORS) with credentials
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  })
);

// Limit repeated requests to the API to prevent brute-force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: "Too many requests from this IP, please try again after 15 minutes.",
  },
});
app.use(limiter);

// Built-in middleware to parse incoming JSON request bodies
app.use(express.json({ limit: "16kb" }));

// Built-in middleware to parse incoming URL-encoded request bodies
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Global preflight handler for all routes
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.sendStatus(200);
});

// Middleware to serve static files from the 'public' directory with CORS headers
app.use('/api/public', (req, res, next) => {
  // Add CORS headers for static files
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use('/api/public', express.static("api/public"));

// Also serve static files from the root path for backward compatibility
app.use(express.static("api/public"));

// --- Route Imports ---
import authRouter from "./routes/auth.routes.js";
import tournamentRouter from "./routes/tournament.routes.js"; // ✅ plural for consistency
import teamRouter from "./routes/team.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import userRouter from "./routes/user.routes.js";
import matchRouter from "./routes/match.routes.js";
import staticRouter from "./routes/static.routes.js";
import bracketRouter from "./routes/bracket.routes.js";
import activityRouter from "./routes/activity.routes.js";

// --- Routes Declaration ---
app.use("/api/auth", authRouter);
app.use("/api/tournaments", tournamentRouter);
app.use("/api/tournaments", bracketRouter); // Bracket routes under tournaments
app.use("/api/teams", teamRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/users", userRouter);
app.use("/api/matches", matchRouter);
app.use("/api/static", staticRouter);
app.use("/api/activities", activityRouter);

// --- Error Handling Middleware ---
// Global error handler - must be after all routes
app.use((err, req, res, next) => {
  let error = err;

  // If it's not our custom ApiError, create one
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Something went wrong";
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  const response = {
    success: false,
    error: error.message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack })
  };

  return res.status(error.statusCode).json(response);
});

// Export the configured app to be used in src/index.js
export { app };
