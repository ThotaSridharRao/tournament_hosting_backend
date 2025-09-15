import mongoose, { Schema } from 'mongoose';

const matchSchema = new Schema(
    {
        tournament: {
            type: Schema.Types.ObjectId,
            ref: "Tournament",
            required: true,
            index: true
        },
        teams: [
            {
                type: Schema.Types.ObjectId,
                ref: "Team"
            }
        ],
        startTime: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            enum: ['scheduled', 'live', 'completed', 'postponed'],
            default: 'scheduled'
        },
        result: {
            winner: {
                type: Schema.Types.ObjectId,
                ref: "Team"
            },
            score: {
                type: String // e.g., "2-1", "15 Kills", "Placement: 1st"
            }
        }
    },
    {
        timestamps: true
    }
);

export const Match = mongoose.model("Match", matchSchema);