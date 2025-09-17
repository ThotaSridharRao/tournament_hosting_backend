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
        players: [
            {
                user: {
                    type: Schema.Types.ObjectId,
                    ref: "User"
                },
                name: {
                    type: String,
                    required: true
                },
                email: {
                    type: String,
                    required: true
                },
                inGameId: {
                    type: String,
                    required: true
                },
                isCaptain: {
                    type: Boolean,
                    default: false
                },
                joinedAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],
        // Payment tracking for multi-round tournaments
        payments: [{
            roundKey: {
                type: String,
                required: true
            },
            amount: {
                type: Number,
                required: true
            },
            status: {
                type: String,
                enum: ['pending', 'paid', 'failed', 'refunded'],
                default: 'pending'
            },
            transactionId: String,
            paymentMethod: String,
            paidAt: Date,
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
        // Legacy payment fields for backward compatibility
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending'
        },
        paymentId: {
            type: String,
            default: null
        },
        totalAmount: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'active', 'eliminated', 'disqualified'],
            default: 'pending'
        },
        // Tournament progression stats
        stats: {
            matchesPlayed: {
                type: Number,
                default: 0
            },
            matchesWon: {
                type: Number,
                default: 0
            },
            totalScore: {
                type: Number,
                default: 0
            },
            currentRound: {
                type: String,
                default: '1'
            },
            bestPosition: {
                type: Number,
                default: null
            }
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