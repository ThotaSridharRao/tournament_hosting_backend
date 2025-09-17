import { Activity } from '../models/activity.model.js';

// Get recent activities for admin dashboard
export const getRecentActivities = async (req, res) => {
    try {
        const { limit = 10, adminOnly = false } = req.query;
        
        const activities = await Activity.getRecentActivities({
            limit: parseInt(limit),
            adminOnly: adminOnly === 'true'
        });

        res.json({
            success: true,
            activities
        });
    } catch (error) {
        console.error('Get recent activities error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activities'
        });
    }
};

// Get platform-wide activities
export const getPlatformActivities = async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        
        const activities = await Activity.getRecentActivities({
            limit: parseInt(limit),
            adminOnly: false
        });

        res.json({
            success: true,
            activities
        });
    } catch (error) {
        console.error('Get platform activities error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch platform activities'
        });
    }
};

// Get activities by type
export const getActivitiesByType = async (req, res) => {
    try {
        const { type } = req.params;
        const { limit = 20 } = req.query;
        
        const activities = await Activity.getRecentActivities({
            limit: parseInt(limit),
            type
        });

        res.json({
            success: true,
            activities
        });
    } catch (error) {
        console.error('Get activities by type error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activities'
        });
    }
};

// Get activities for a specific tournament
export const getTournamentActivities = async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const { limit = 20 } = req.query;
        
        const activities = await Activity.getRecentActivities({
            limit: parseInt(limit),
            tournamentId
        });

        res.json({
            success: true,
            activities
        });
    } catch (error) {
        console.error('Get tournament activities error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tournament activities'
        });
    }
};

// Activity logging helper functions
export const ActivityLogger = {
    // User activities
    userRegistered: async (user) => {
        return Activity.logActivity({
            type: 'user_registered',
            title: 'New User Registration',
            description: `${user.username} joined EArena`,
            user: user._id,
            metadata: { email: user.email },
            severity: 'low'
        });
    },

    userLogin: async (user) => {
        return Activity.logActivity({
            type: 'user_login',
            title: 'User Login',
            description: `${user.username} logged in`,
            user: user._id,
            severity: 'low',
            adminOnly: true
        });
    },

    // Tournament activities
    tournamentCreated: async (tournament, admin) => {
        return Activity.logActivity({
            type: 'tournament_created',
            title: 'Tournament Created',
            description: `New tournament "${tournament.title}" created for ${tournament.game}`,
            user: admin._id,
            tournament: tournament._id,
            metadata: { 
                game: tournament.game,
                prizePool: tournament.prizePool,
                maxTeams: tournament.maxTeams
            },
            severity: 'medium'
        });
    },

    tournamentRegistrationOpened: async (tournament) => {
        return Activity.logActivity({
            type: 'tournament_registration_opened',
            title: 'Registration Opened',
            description: `Registration is now open for "${tournament.title}"`,
            tournament: tournament._id,
            metadata: { 
                game: tournament.game,
                registrationEnd: tournament.registrationEnd
            },
            severity: 'medium'
        });
    },

    tournamentRegistrationClosed: async (tournament) => {
        return Activity.logActivity({
            type: 'tournament_registration_closed',
            title: 'Registration Closed',
            description: `Registration closed for "${tournament.title}" with ${tournament.registeredTeams?.length || 0} teams`,
            tournament: tournament._id,
            metadata: { 
                totalTeams: tournament.registeredTeams?.length || 0
            },
            severity: 'medium'
        });
    },

    tournamentStarted: async (tournament) => {
        return Activity.logActivity({
            type: 'tournament_started',
            title: 'Tournament Started',
            description: `"${tournament.title}" has begun!`,
            tournament: tournament._id,
            metadata: { 
                game: tournament.game,
                totalTeams: tournament.registeredTeams?.length || 0
            },
            severity: 'high'
        });
    },

    tournamentEnded: async (tournament, winner) => {
        return Activity.logActivity({
            type: 'tournament_ended',
            title: 'Tournament Completed',
            description: `"${tournament.title}" has ended${winner ? ` - Winner: ${winner.name}` : ''}`,
            tournament: tournament._id,
            team: winner?._id,
            metadata: { 
                game: tournament.game,
                winner: winner?.name
            },
            severity: 'high'
        });
    },

    // Team activities
    teamRegistered: async (team, tournament, user) => {
        return Activity.logActivity({
            type: 'team_registered',
            title: 'Team Registration',
            description: `Team "${team.name}" registered for "${tournament.title}"`,
            user: user._id,
            tournament: tournament._id,
            team: team._id,
            metadata: { 
                teamName: team.name,
                tournamentGame: tournament.game
            },
            severity: 'low'
        });
    },

    teamPaymentCompleted: async (team, tournament, amount) => {
        return Activity.logActivity({
            type: 'team_payment_completed',
            title: 'Payment Completed',
            description: `Team "${team.name}" completed payment of $${amount} for "${tournament.title}"`,
            tournament: tournament._id,
            team: team._id,
            metadata: { 
                amount,
                teamName: team.name
            },
            severity: 'medium'
        });
    },

    // Bracket activities
    bracketCreated: async (tournament, totalTeams) => {
        return Activity.logActivity({
            type: 'bracket_created',
            title: 'Tournament Bracket Created',
            description: `Bracket initialized for "${tournament.title}" with ${totalTeams} teams`,
            tournament: tournament._id,
            metadata: { 
                totalTeams,
                tournamentName: tournament.title
            },
            severity: 'medium'
        });
    },

    roundStarted: async (tournament, roundNumber) => {
        return Activity.logActivity({
            type: 'round_started',
            title: `Round ${roundNumber} Started`,
            description: `Round ${roundNumber} has begun for "${tournament.title}"`,
            tournament: tournament._id,
            metadata: { 
                round: roundNumber,
                tournamentName: tournament.title
            },
            severity: 'medium'
        });
    },

    roundCompleted: async (tournament, roundNumber, qualifiedTeams) => {
        return Activity.logActivity({
            type: 'round_completed',
            title: `Round ${roundNumber} Completed`,
            description: `Round ${roundNumber} finished for "${tournament.title}" - ${qualifiedTeams} teams qualified`,
            tournament: tournament._id,
            metadata: { 
                round: roundNumber,
                qualifiedTeams,
                tournamentName: tournament.title
            },
            severity: 'medium'
        });
    },

    // Admin activities
    adminAction: async (admin, action, details) => {
        return Activity.logActivity({
            type: 'admin_action',
            title: 'Admin Action',
            description: `${admin.username} ${action}`,
            user: admin._id,
            metadata: details,
            severity: 'medium',
            adminOnly: true
        });
    },

    // System notifications
    systemNotification: async (title, description, severity = 'low') => {
        return Activity.logActivity({
            type: 'system_notification',
            title,
            description,
            severity,
            adminOnly: true
        });
    }
};