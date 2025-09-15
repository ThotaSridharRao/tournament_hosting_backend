// src/seed/seed.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model.js';
import { Tournament } from '../models/tournament.model.js';
import { Team } from '../models/team.model.js'; // Import Team model

// Load environment variables from the root .env file
dotenv.config({ path: '../../.env' });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB connected for seeding...");
    } catch (error) {
        console.error("MongoDB connection FAILED for seeding: ", error);
        process.exit(1);
    }
};

const seedDB = async () => {
    try {
        await connectDB();

        // Clear existing data
        console.log("Clearing existing data...");
        await User.deleteMany({});
        await Tournament.deleteMany({});
        await Team.deleteMany({}); // Clear teams as well

        console.log("Data cleared. Seeding new data...");

        // 1. Create an Admin User
        const adminUser = await User.create({
            username: "admin",
            email: "admin@earena.com",
            password: "password123", // The model will hash this automatically
            roles: ["user", "admin"]
        });
        console.log("Admin user created:", adminUser.username);

        // 2. Create Sample Tournaments organized by the Admin
        const tournamentsData = [
            {
                title: "PUBG Global Series 2025",
                description: "The biggest PUBG tournament of the year is here! Join the best teams from around the world.",
                game: "PUBG",
                prizePool: 500000,
                maxTeams: 32,
                registrationStart: "2025-09-10",
                registrationEnd: "2025-09-20",
                tournamentStart: "2025-09-25",
                tournamentEnd: "2025-10-02",
                organizer: adminUser._id,
                status: 'registration' // Set a specific status for testing
            },
            {
                title: "BGMI Masters Championship",
                description: "India's premier BGMI tournament featuring the country's top teams.",
                game: "BGMI",
                prizePool: 300000,
                maxTeams: 24,
                registrationStart: "2025-10-01",
                registrationEnd: "2025-10-10",
                tournamentStart: "2025-10-15",
                tournamentEnd: "2025-10-22",
                organizer: adminUser._id,
                status: 'upcoming'
            },
            {
                title: "Valorant Champions Tour India",
                description: "The top Valorant teams in India battle for a spot in the global championship.",
                game: "Valorant",
                prizePool: 250000,
                maxTeams: 16,
                registrationStart: "2025-08-01",
                registrationEnd: "2025-08-15",
                tournamentStart: "2025-08-20",
                tournamentEnd: "2025-08-25",
                organizer: adminUser._id,
                status: 'completed'
            }
        ];

        await Tournament.insertMany(tournamentsData);
        console.log(`${tournamentsData.length} tournaments have been created.`);

        console.log("✅ Database seeded successfully!");

    } catch (error) {
        console.error("Error seeding database:", error);
        process.exit(1);
    } finally {
        // Ensure the connection is closed
        mongoose.connection.close();
        console.log("MongoDB connection closed.");
    }
};

seedDB();