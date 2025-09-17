// src/models/tournament.model.js

import mongoose, { Schema } from 'mongoose';

const tournamentSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true
        },
        description: {
            type: String,
            required: true
        },
        game: {
            type: String,
            required: true,
            trim: true
        },
        prizePool: {
            type: Number,
            default: 0
        },
        maxTeams: {
            type: Number,
            required: true
        },
        // We will create the 'Team' and 'User' models later for these references
        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: "Team"
            }
        ],
        organizer: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        status: {
            type: String,
            enum: ['upcoming', 'registration', 'live', 'completed', 'cancelled'],
            default: 'upcoming'
        },
        posterImage: {
            type: String // Will store a URL to the uploaded image
        },
        registrationStart: {
            type: Date,
            required: true
        },
        registrationEnd: {
            type: Date,
            required: true,
            validate: {
                validator: function(value) {
                    return value > this.registrationStart;
                },
                message: 'Registration end date must be after registration start date'
            }
        },
        tournamentStart: {
            type: Date,
            required: true,
            validate: {
                validator: function(value) {
                    return value >= this.registrationEnd;
                },
                message: 'Tournament start date must be after registration end date'
            }
        },
        tournamentEnd: {
            type: Date,
            required: true,
            validate: {
                validator: function(value) {
                    return value > this.tournamentStart;
                },
                message: 'Tournament end date must be after tournament start date'
            }
        },
        entryFee: {
            type: Number,
            default: 0,
            min: 0
        },
        format: {
            type: String,
            enum: ['single-elimination', 'double-elimination', 'round-robin', 'swiss', 'group-stage'],
            default: 'single-elimination'
        }
    },
    {
        timestamps: true
    }
);

// Mongoose hook to automatically generate a slug from the title before saving
tournamentSchema.pre("save", function (next) {
    if (this.isModified("title")) {
        this.slug = this.title
            .toLowerCase()
            .replace(/&/g, 'and')          // Replace & with 'and'
            .replace(/[^a-z0-9 -]/g, '')   // Remove invalid characters
            .replace(/\s+/g, '-')          // Collapse whitespace and replace with -
            .replace(/-+/g, '-');          // Collapse consecutive dashes
    }
    next();
});

export const Tournament = mongoose.model("Tournament", tournamentSchema);