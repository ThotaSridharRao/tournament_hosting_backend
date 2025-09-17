import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import { Tournament } from '../models/tournament.model.js';

// Configure environment variables
dotenv.config({ path: '../.env' });

const addScheduleEvents = async () => {
    try {
        await connectDB();
        console.log('Connected to database');

        // Find the first tournament
        const tournament = await Tournament.findOne();
        
        if (!tournament) {
            console.log('No tournaments found. Please create a tournament first.');
            process.exit(1);
        }

        console.log(`Adding schedule events to tournament: ${tournament.title}`);

        // Sample schedule events
        const scheduleEvents = [
            {
                id: Date.now().toString(),
                title: 'Registration Opens',
                type: 'registration',
                date: '2024-12-20',
                time: '10:00',
                description: 'Tournament registration opens for all teams. Make sure to register early!'
            },
            {
                id: (Date.now() + 1).toString(),
                title: 'Team Verification',
                type: 'other',
                date: '2024-12-22',
                time: '14:00',
                description: 'All registered teams will be verified and confirmed for participation.'
            },
            {
                id: (Date.now() + 2).toString(),
                title: 'Opening Ceremony',
                type: 'ceremony',
                date: '2024-12-25',
                time: '18:00',
                description: 'Grand opening ceremony with special guests and tournament overview.'
            },
            {
                id: (Date.now() + 3).toString(),
                title: 'Group Stage - Day 1',
                type: 'match',
                date: '2024-12-26',
                time: '10:00',
                description: 'First day of group stage matches. All teams compete in their respective groups.'
            },
            {
                id: (Date.now() + 4).toString(),
                title: 'Group Stage - Day 2',
                type: 'match',
                date: '2024-12-27',
                time: '10:00',
                description: 'Second day of group stage matches. Qualification spots will be determined.'
            },
            {
                id: (Date.now() + 5).toString(),
                title: 'Playoffs - Quarterfinals',
                type: 'match',
                date: '2024-12-28',
                time: '15:00',
                description: 'Top 8 teams compete in quarterfinal matches. Single elimination format.'
            },
            {
                id: (Date.now() + 6).toString(),
                title: 'Grand Finals',
                type: 'match',
                date: '2024-12-30',
                time: '19:00',
                description: 'The ultimate showdown! Final two teams compete for the championship.'
            }
        ];

        // Update the tournament with schedule events
        tournament.scheduleEvents = scheduleEvents;
        await tournament.save();

        console.log(`✅ Successfully added ${scheduleEvents.length} schedule events to tournament: ${tournament.title}`);
        console.log('Schedule events:');
        scheduleEvents.forEach(event => {
            console.log(`  - ${event.title} (${event.date} ${event.time})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding schedule events:', error);
        process.exit(1);
    }
};

addScheduleEvents();