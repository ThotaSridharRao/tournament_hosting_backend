// src/models/team.model.js

import mongoose, { Schema } from 'mongoose';

const teamSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Team name is required"],
            trim: true,
            unique: true
        },
        tournament: {
            type: Schema.Types.ObjectId,
            ref: "Tournament",
            required: true,
            index: true // Index for faster queries by tournament
        },
        captain: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        members: [
            {
                type: Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        }
    },
    {
        timestamps: true
    }
);

// Create a compound index. This is a database-level rule that ensures
// the combination of a team's name and its tournament must be unique.
// This prevents two teams from having the same name in the same tournament.
teamSchema.index({ name: 1, tournament: 1 }, { unique: true });

export const Team = mongoose.model("Team", teamSchema);