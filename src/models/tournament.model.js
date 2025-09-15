const mongoose = require('mongoose');

const TournamentSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  subtitle: { type: String },
  description: { type: String },
  game: { type: String, default: 'unknown' },
  prizePool: { type: Number, default: 0 },
  maxTeams: { type: Number, default: 16 },
  status: { type: String, enum: ['upcoming','registration','live','completed'], default: 'upcoming' },
  registrationStart: { type: Date },
  registrationEnd: { type: Date },
  tournamentStart: { type: Date },
  tournamentEnd: { type: Date },
  backgroundImage: { type: String },
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Tournament', TournamentSchema);
