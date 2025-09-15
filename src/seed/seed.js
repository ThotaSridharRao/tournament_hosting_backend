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

  // Create users
  const passwordHash = await bcrypt.hash('password123', 10);
  const u1 = await User.create({ username: 'captain1', email: 'captain1@example.com', passwordHash });
  const u2 = await User.create({ username: 'player2', email: 'player2@example.com', passwordHash });

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

  // Create tournament
  const now = new Date();
  const registrationStart = new Date(now.getTime() - 1000 * 60 * 60 * 24); // yesterday
  const registrationEnd = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7); // in 7 days
  const tournamentStart = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 8); // in 8 days
  const tournamentEnd = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 9); // in 9 days

  await Tournament.create({
    slug: 'autumn-showdown',
    title: 'Autumn Showdown',
    subtitle: '5v5 BF Battle',
    description: 'Sample tournament seeded for local development.',
    game: 'PUBG',
    prizePool: 5000,
    maxTeams: 16,
    status: 'registration',
    registrationStart,
    registrationEnd,
    tournamentStart,
    tournamentEnd,
    backgroundImage: ''
  });

  console.log('✅ Seed complete. User: captain1@example.com / password123');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
