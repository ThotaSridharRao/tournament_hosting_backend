import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { app } from './app.js';

// Configure environment variables from the .env file in the root directory
dotenv.config({
    path: '../.env'
});

const port = process.env.PORT || 8000;

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