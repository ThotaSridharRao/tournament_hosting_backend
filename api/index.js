import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import connectDB from './config/db.js';
import { app } from './app.js';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure environment variables from the .env file
// Try multiple possible paths for the .env file
const possibleEnvPaths = [
    join(__dirname, '..', '.env'),  // Parent directory of api folder
    join(process.cwd(), '.env'),    // Current working directory
    '.env'                          // Relative to current working directory
];

let envLoaded = false;
for (const envPath of possibleEnvPaths) {
    console.log('🔍 Trying .env file at:', envPath);
    
    const result = dotenv.config({ path: envPath });
    
    if (!result.error) {
        console.log('✅ .env file loaded successfully from:', envPath);
        envLoaded = true;
        break;
    } else {
        console.log('❌ Failed to load from:', envPath, '-', result.error.message);
    }
}

if (!envLoaded) {
    console.error('❌ Could not load .env file from any location');
}

// Debug environment variables
console.log('🔧 Environment Debug:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'NOT SET');

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