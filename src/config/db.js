// src/config/db.js

import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        // The MONGODB_URI from your .env file already contains the database name.
        // Mongoose will connect to the database specified in that URI.
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI);

        console.log(`\n✅ MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("MONGODB connection FAILED: ", error);
        process.exit(1); // Exit the process with a failure code
    }
};

export default connectDB;