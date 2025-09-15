// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100
});
app.use(limiter);

// Routes
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date() }));

const authRoutes = require('./routes/auth.routes');
const tournamentsRoutes = require('./routes/tournaments.routes');
const matchesRoutes = require('./routes/matches.routes');
const contentRoutes = require('./routes/content.routes');

app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/content', contentRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Server error' });
});

module.exports = app;
