const mongoose = require("mongoose");

const TournamentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    prizePool: {
      type: Number,
      default: 0,
    },
    game: {
      type: String,
      default: "Gaming",
    },
    status: {
      type: String,
      enum: ["upcoming", "live", "completed", "registration"],
      default: "upcoming",
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    backgroundImage: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tournament", TournamentSchema);
