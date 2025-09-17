import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import { Activity } from '../models/activity.model.js';
import { User } from '../models/user.model.js';
import { Tournament } from '../models/tournament.model.js';

// Configure environment variables
dotenv.config({ path: '../.env' });

const seedActivities = async () => {
    try {
        await connectDB();
        console.log('Connected to database');

        // Clear existing activities
        await Activity.deleteMany({});
        console.log('Cleared existing activities');

        // Get some users and tournaments for reference
        const users = await User.find().limit(3);
        const tournaments = await Tournament.find().limit(2);

        const sampleActivities = [
            {
                type: 'user_registered',
                title: 'New User Registration',
                description: 'GamerPro123 joined EArena',
                user: users[0]?._id,
                severity: 'low',
                isPublic: true,
                adminOnly: false
            },
            {
                type: 'user_registered',
                title: 'New User Registration',
                description: 'ElitePlayer456 joined EArena',
                user: users[1]?._id,
                severity: 'low',
                isPublic: true,
                adminOnly: false
            },
            {
                type: 'tournament_created',
                title: 'Tournament Created',
                description: `New tournament "${tournaments[0]?.title || 'PUBG Championship'}" created for ${tournaments[0]?.game || 'PUBG Mobile'}`,
                user: users[0]?._id,
                tournament: tournaments[0]?._id,
                metadata: { 
                    game: tournaments[0]?.game || 'PUBG Mobile',
                    prizePool: tournaments[0]?.prizePool || 50000,
                    maxTeams: tournaments[0]?.maxTeams || 100
                },
                severity: 'medium',
                isPublic: true,
                adminOnly: false
            },
            {
                type: 'tournament_registration_opened',
                title: 'Registration Opened',
                description: `Registration is now open for "${tournaments[0]?.title || 'PUBG Championship'}"`,
                tournament: tournaments[0]?._id,
                metadata: { 
                    game: tournaments[0]?.game || 'PUBG Mobile'
                },
                severity: 'medium',
                isPublic: true,
                adminOnly: false
            },
            {
                type: 'team_registered',
                title: 'Team Registration',
                description: `Team "Alpha Squad" registered for "${tournaments[0]?.title || 'PUBG Championship'}"`,
                user: users[1]?._id,
                tournament: tournaments[0]?._id,
                metadata: { 
                    teamName: 'Alpha Squad',
                    tournamentGame: tournaments[0]?.game || 'PUBG Mobile'
                },
                severity: 'low',
                isPublic: true,
                adminOnly: false
            },
            {
                type: 'team_registered',
                title: 'Team Registration',
                description: `Team "Beta Warriors" registered for "${tournaments[0]?.title || 'PUBG Championship'}"`,
                user: users[2]?._id,
                tournament: tournaments[0]?._id,
                metadata: { 
                    teamName: 'Beta Warriors',
                    tournamentGame: tournaments[0]?.game || 'PUBG Mobile'
                },
                severity: 'low',
                isPublic: true,
                adminOnly: false
            },
            {
                type: 'user_login',
                title: 'User Login',
                description: `${users[0]?.username || 'GamerPro123'} logged in`,
                user: users[0]?._id,
                severity: 'low',
                isPublic: false,
                adminOnly: true
            },
            {
                type: 'admin_action',
                title: 'Admin Action',
                description: `${users[0]?.username || 'Admin'} updated platform settings`,
                user: users[0]?._id,
                metadata: { action: 'settings_update' },
                severity: 'medium',
                isPublic: false,
                adminOnly: true
            },
            {
                type: 'system_notification',
                title: 'System Maintenance',
                description: 'Scheduled maintenance completed successfully',
                severity: 'low',
                isPublic: false,
                adminOnly: true
            },
            {
                type: 'tournament_started',
                title: 'Tournament Started',
                description: `"${tournaments[1]?.title || 'Valorant Pro League'}" has begun!`,
                tournament: tournaments[1]?._id,
                metadata: { 
                    game: tournaments[1]?.game || 'Valorant',
                    totalTeams: 64
                },
                severity: 'high',
                isPublic: true,
                adminOnly: false
            }
        ];

        // Create activities with different timestamps
        for (let i = 0; i < sampleActivities.length; i++) {
            const activity = sampleActivities[i];
            const createdAt = new Date();
            createdAt.setMinutes(createdAt.getMinutes() - (i * 15)); // Space them 15 minutes apart
            
            await Activity.create({
                ...activity,
                createdAt
            });
        }

        console.log(`✅ Successfully seeded ${sampleActivities.length} activities`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding activities:', error);
        process.exit(1);
    }
};

seedActivities();