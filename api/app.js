import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();

// --- Global Middleware ---

// Trust the first proxy in front of the app (important for Render/Heroku/etc.)
app.set("trust proxy", 1);

// Set security-related HTTP headers
app.use(helmet());

// Define allowed origins for CORS
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:5502", // VSCode Live Server default
  "http://127.0.0.1:5500", // Alternate Live Server port
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

// Middleware to serve static files from the 'public' directory
app.use(express.static("api/public"));

// --- Route Imports ---
import authRouter from "./routes/auth.routes.js";
import tournamentRouter from "./routes/tournament.routes.js"; // ✅ plural for consistency
import teamRouter from "./routes/team.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import userRouter from "./routes/user.routes.js";
import matchRouter from "./routes/match.routes.js";

// --- Routes Declaration ---
app.use("/api/auth", authRouter);
app.use("/api/tournaments", tournamentRouter);
app.use("/api/teams", teamRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/users", userRouter);
app.use("/api/matches", matchRouter);

// Export the configured app to be used in src/index.js
export { app };
