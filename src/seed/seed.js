// src/seed/seed.js
require('dotenv').config();
const connectDB = require('../config/db');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/user.model');
const Team = require('../models/team.model');
const Tournament = require('../models/tournament.model');

async function seed() {
  await connectDB();

  // Clear old data
  await User.deleteMany({});
  await Team.deleteMany({});
  await Tournament.deleteMany({});

  // Create users with different roles and profiles
  const passwordHash = await bcrypt.hash('password123', 12);
  
  // Admin user
  const admin = await User.create({ 
    username: 'admin', 
    email: 'admin@earena.com', 
    passwordHash,
    roles: ['admin', 'user'],
    isEmailVerified: true,
    profile: {
      firstName: 'Admin',
      lastName: 'User',
      bio: 'EArena platform administrator',
      preferredGame: 'PUBG'
    }
  });
  
  // Regular users
  const u1 = await User.create({ 
    username: 'captain1', 
    email: 'captain1@example.com', 
    passwordHash,
    isEmailVerified: true,
    profile: {
      firstName: 'John',
      lastName: 'Captain',
      bio: 'Professional PUBG player and team captain',
      country: 'India',
      preferredGame: 'PUBG'
    }
  });
  
  const u2 = await User.create({ 
    username: 'player2', 
    email: 'player2@example.com', 
    passwordHash,
    isEmailVerified: true,
    profile: {
      firstName: 'Sarah',
      lastName: 'Player',
      bio: 'BGMI enthusiast and competitive player',
      country: 'India',
      preferredGame: 'BGMI'
    }
  });

  // Test user for frontend testing
  const testUser = await User.create({ 
    username: 'testuser', 
    email: 'test@earena.com', 
    passwordHash,
    isEmailVerified: true,
    profile: {
      firstName: 'Test',
      lastName: 'User',
      bio: 'Test account for development',
      preferredGame: 'PUBG'
    }
  });

  // Create team
  const team = await Team.create({
    name: 'Team Alpha',
    tag: 'ALP',
    members: [
      { user: u1._id, role: 'captain' },
      { user: u2._id, role: 'player' }
    ],
    captain: u1._id
  });

  // Create tournaments
  const now = new Date();
  
  // Tournament 1 - PUBG Global Series 2025 (Featured)
  const registrationStart1 = new Date(now.getTime() - 1000 * 60 * 60 * 24); // yesterday
  const registrationEnd1 = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7); // in 7 days
  const tournamentStart1 = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 8); // in 8 days
  const tournamentEnd1 = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 9); // in 9 days

  await Tournament.create({
    slug: 'pubg-global-series-2025',
    title: 'PUBG Global Series 2025',
    subtitle: 'The Ultimate Global Championship',
    description: 'The biggest PUBG tournament of the year is here! Join us as the best teams from around the world battle it out in London for the title of Global Champions.',
    game: 'PUBG',
    prizePool: 500000,
    maxTeams: 32,
    status: 'registration',
    registrationStart: registrationStart1,
    registrationEnd: registrationEnd1,
    tournamentStart: tournamentStart1,
    tournamentEnd: tournamentEnd1,
    backgroundImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
  });

  // Tournament 2 - BGMI Masters Championship (Live)
  const registrationStart2 = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10); // 10 days ago
  const registrationEnd2 = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3); // 3 days ago
  const tournamentStart2 = new Date(now.getTime() - 1000 * 60 * 60 * 24); // yesterday
  const tournamentEnd2 = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2); // in 2 days

  await Tournament.create({
    slug: 'bgmi-masters-championship',
    title: 'BGMI Masters Championship',
    subtitle: 'India\'s Premier BGMI Tournament',
    description: 'India\'s premier BGMI tournament featuring the country\'s top teams competing for glory and massive prizes in an epic battle royale showdown.',
    game: 'BGMI',
    prizePool: 300000,
    maxTeams: 24,
    status: 'live',
    registrationStart: registrationStart2,
    registrationEnd: registrationEnd2,
    tournamentStart: tournamentStart2,
    tournamentEnd: tournamentEnd2,
    backgroundImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80'
  });

  // Tournament 3 - BGMI Championship Series (Upcoming)
  const registrationStart3 = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 5); // in 5 days
  const registrationEnd3 = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 15); // in 15 days
  const tournamentStart3 = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 20); // in 20 days
  const tournamentEnd3 = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30); // in 30 days

  await Tournament.create({
    slug: 'bgmi-championship-series',
    title: 'BGMI Championship Series',
    subtitle: 'The Ultimate Battle Royale Championship',
    description: 'The biggest BGMI tournament of the year! Assemble your squad and compete against India\'s best players for the ultimate battle royale championship title.',
    game: 'BGMI',
    prizePool: 750000,
    maxTeams: 48,
    status: 'upcoming',
    registrationStart: registrationStart3,
    registrationEnd: registrationEnd3,
    tournamentStart: tournamentStart3,
    tournamentEnd: tournamentEnd3,
    backgroundImage: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
  });

  // Tournament 4 - Completed Tournament for Past Results
  const registrationStart4 = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30); // 30 days ago
  const registrationEnd4 = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 20); // 20 days ago
  const tournamentStart4 = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 15); // 15 days ago
  const tournamentEnd4 = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10); // 10 days ago

  await Tournament.create({
    slug: 'pubg-nations-cup-2024',
    title: 'PUBG Nations Cup 2024',
    subtitle: 'International Championship Concluded',
    description: 'International tournament concluded with spectacular performances where top teams battled for supremacy.',
    game: 'PUBG',
    prizePool: 400000,
    maxTeams: 28,
    status: 'completed',
    registrationStart: registrationStart4,
    registrationEnd: registrationEnd4,
    tournamentStart: tournamentStart4,
    tournamentEnd: tournamentEnd4,
    backgroundImage: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
  });

  console.log('✅ Seed complete!');
  console.log('📧 Test accounts created:');
  console.log('   Admin: admin@earena.com / password123');
  console.log('   User 1: captain1@example.com / password123');
  console.log('   User 2: player2@example.com / password123');
  console.log('   Test: test@earena.com / password123');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
