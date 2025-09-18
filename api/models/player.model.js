// src/models/player.model.js

import mongoose, { Schema } from 'mongoose';

const playerSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Player name is required"],
            trim: true
        },
        inGameId: {
            type: String,
            required: [true, "In-game ID is required"],
            trim: true
        },
        phoneNumber: {
            type: String,
            required: false, // Made optional
            trim: true,
            validate: {
                validator: function(v) {
                    // Only validate if phone number is provided
                    return !v || /^[6-9]\d{9}$/.test(v); // Indian mobile number format
                },
                message: 'Please enter a valid 10-digit phone number'
            }
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
            lowercase: true,
            validate: {
                validator: function(v) {
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
                },
                message: 'Please enter a valid email address'
            }
        },
        team: {
            type: Schema.Types.ObjectId,
            ref: "Team",
            required: true
        },
        tournament: {
            type: Schema.Types.ObjectId,
            ref: "Tournament",
            required: true
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User", // Link to registered user if they have an account
            default: null
        },
        isCaptain: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

// Ensure unique player per team
playerSchema.index({ email: 1, tournament: 1 }, { unique: true });
// Note: phoneNumber index removed since it's now optional

export const Player = mongoose.model("Player", playerSchema);