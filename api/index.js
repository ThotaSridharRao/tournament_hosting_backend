import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { app } from './app.js';
import cors from 'cors'; // Import the cors package

// Configure environment variables from the .env file
dotenv.config({
    path: '../.env'
});

const port = process.env.PORT || 8000;

// --- CORS Configuration ---
// This setup is crucial for allowing your frontend to communicate with this backend.
const corsOptions = {
    // Read the allowed frontend URL from an environment variable for security and flexibility.
    origin: process.env.CORS_ORIGIN || 'http://localhost:5502', 
    credentials: true // Allows cookies or authorization headers to be sent
};

// Apply the CORS middleware to your Express app
app.use(cors(corsOptions));


// Connect to the database and start the server
connectDB()
.then(() => {
    // Start listening for requests only after the database is connected
    app.listen(port, () => {
        console.log(`✅ Server is running on port: ${port}`);
    });

    // Optional: Handle errors from the Express app itself
    app.on("error", (error) => {
        console.error("EXPRESS APP ERROR: ", error);
        throw error;
    });
})
.catch((err) => {
    // Log a critical error if the database connection fails
    console.error("MONGO DB connection failed !!! ", err);
    process.exit(1);
});