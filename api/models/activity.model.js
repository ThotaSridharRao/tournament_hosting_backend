import mongoose, { Schema } from 'mongoose';

const activitySchema = new Schema({
    type: {
        type: String,
        required: true,
        enum: [
            'user_registered',
            'user_login',
            'tournament_created',
            'tournament_updated',
            'tournament_deleted',
            'tournament_registration_opened',
            'tournament_registration_closed',
            'tournament_started',
            'tournament_ended',
            'team_registered',
            'team_payment_completed',
            'team_qualified',
            'team_eliminated',
            'bracket_created',
            'round_started',
            'round_completed',
            'match_completed',
            'admin_action',
            'system_notification'
        ]
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    tournament: {
        type: Schema.Types.ObjectId,
        ref: 'Tournament'
    },
    team: {
        type: Schema.Types.ObjectId,
        ref: 'Team'
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low'
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    adminOnly: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for better query performance
activitySchema.index({ type: 1, createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ tournament: 1, createdAt: -1 });
activitySchema.index({ isPublic: 1, createdAt: -1 });
activitySchema.index({ adminOnly: 1, createdAt: -1 });

// Static method to log activity
activitySchema.statics.logActivity = async function(activityData) {
    try {
        const activity = new this(activityData);
        await activity.save();
        return activity;
    } catch (error) {
        console.error('Failed to log activity:', error);
        return null;
    }
};

// Static method to get recent activities
activitySchema.statics.getRecentActivities = async function(options = {}) {
    const {
        limit = 20,
        adminOnly = false,
        type = null,
        userId = null,
        tournamentId = null
    } = options;

    const query = {};
    
    if (adminOnly) {
        query.adminOnly = true;
    } else {
        query.isPublic = true;
    }
    
    if (type) query.type = type;
    if (userId) query.user = userId;
    if (tournamentId) query.tournament = tournamentId;

    return this.find(query)
        .populate('user', 'username email')
        .populate('tournament', 'title slug')
        .populate('team', 'name')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
};

export const Activity = mongoose.model('Activity', activitySchema);