// src/models/tournamentBracket.model.js

import mongoose, { Schema } from 'mongoose';

const matchSchema = new Schema({
    matchId: {
        type: String
    },
    opponent: {
        type: Schema.Types.ObjectId
    },
    result: {
        type: String // 'win', 'loss', 'draw'
    },
    score: {
        type: Number
    },
    timestamp: {
        type: Date
    }
});

const teamSchema = new Schema({
    teamId: {
        type: Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    teamName: {
        type: String
    },
    status: {
        type: String,
        enum: ['registered', 'paid', 'active', 'qualified', 'eliminated'],
        default: 'registered'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending'
    },
    groupId: {
        type: Number
    },
    score: {
        type: Number,
        default: 0
    },
    position: {
        type: Number
    },
    matches: [matchSchema]
});

const groupSchema = new Schema({
    groupId: {
        type: Number
    },
    teams: [{
        type: Schema.Types.ObjectId
    }],
    status: {
        type: String,
        enum: ['pending', 'active', 'completed'],
        default: 'pending'
    },
    qualifiedTeams: [{
        type: Schema.Types.ObjectId
    }]
});

const roundSchema = new Schema({
    status: {
        type: String,
        enum: ['pending', 'active', 'completed'],
        default: 'pending'
    },
    startTime: {
        type: Date
    },
    endTime: {
        type: Date
    },
    teams: [teamSchema],
    groups: [groupSchema]
});

const finalRoundSchema = new Schema({
    status: {
        type: String,
        enum: ['pending', 'active', 'completed'],
        default: 'pending'
    },
    startTime: {
        type: Date
    },
    endTime: {
        type: Date
    },
    teams: [teamSchema],
    winner: {
        type: Schema.Types.ObjectId,
        ref: 'Team'
    },
    rankings: [{
        position: {
            type: Number
        },
        team: {
            type: Schema.Types.ObjectId,
            ref: 'Team'
        },
        prize: {
            type: Number
        }
    }]
});

const roundConfigSchema = new Schema({
    name: {
        type: String
    },
    teamsPerGroup: {
        type: Number
    },
    qualifyingTeams: {
        type: Number
    },
    entryFee: {
        type: Number
    }
});

const tournamentBracketSchema = new Schema({
    tournament: {
        type: Schema.Types.ObjectId,
        ref: 'Tournament',
        required: true,
        unique: true
    },
    totalTeams: {
        type: Number,
        required: true
    },
    currentRound: {
        type: String,
        enum: ['1', '2', '3', '4', 'final'],
        default: '1'
    },
    status: {
        type: String,
        enum: ['initialized', 'active', 'completed'],
        default: 'initialized'
    },
    rounds: {
        '1': roundSchema,
        '2': roundSchema,
        '3': roundSchema,
        '4': roundSchema,
        'final': finalRoundSchema
    },
    roundConfig: {
        '1': {
            type: roundConfigSchema,
            default: {
                name: 'Round 1',
                teamsPerGroup: 25,
                qualifyingTeams: 4,
                entryFee: 100
            }
        },
        '2': {
            type: roundConfigSchema,
            default: {
                name: 'Round 2',
                teamsPerGroup: 4,
                qualifyingTeams: 4,
                entryFee: 200
            }
        },
        '3': {
            type: roundConfigSchema,
            default: {
                name: 'Round 3',
                teamsPerGroup: 4,
                qualifyingTeams: 4,
                entryFee: 300
            }
        },
        '4': {
            type: roundConfigSchema,
            default: {
                name: 'Round 4',
                teamsPerGroup: 4,
                qualifyingTeams: 4,
                entryFee: 500
            }
        },
        'final': {
            type: roundConfigSchema,
            default: {
                name: 'Finals',
                teamsPerGroup: 16,
                qualifyingTeams: 1,
                entryFee: 0
            }
        }
    },
    stats: {
        totalRevenue: {
            type: Number,
            default: 0
        },
        revenueByRound: {
            '1': { type: Number, default: 0 },
            '2': { type: Number, default: 0 },
            '3': { type: Number, default: 0 },
            '4': { type: Number, default: 0 }
        },
        teamsEliminated: {
            type: Number,
            default: 0
        },
        matchesCompleted: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Indexes
tournamentBracketSchema.index({ tournament: 1 });
tournamentBracketSchema.index({ currentRound: 1 });
tournamentBracketSchema.index({ status: 1 });

// Method to initialize brackets with teams
tournamentBracketSchema.methods.initializeWithTeams = function(teams) {
    // Shuffle teams randomly
    const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
    
    // Create 4 groups of 25 teams each for Round 1
    const round1Teams = [];
    const round1Groups = [];
    
    for (let i = 0; i < 4; i++) {
        const groupTeams = shuffledTeams.slice(i * 25, (i + 1) * 25);
        const group = {
            groupId: i + 1,
            teams: groupTeams.map(team => team._id),
            status: 'pending',
            qualifiedTeams: []
        };
        round1Groups.push(group);
        
        // Add teams to round 1
        groupTeams.forEach(team => {
            round1Teams.push({
                teamId: team._id,
                teamName: team.name,
                status: 'registered',
                paymentStatus: 'pending',
                groupId: i + 1,
                score: 0,
                matches: []
            });
        });
    }
    
    this.rounds['1'].teams = round1Teams;
    this.rounds['1'].groups = round1Groups;
    this.totalTeams = teams.length;
    
    return this.save();
};

// Method to start a round
tournamentBracketSchema.methods.startRound = function(roundKey) {
    if (!this.rounds[roundKey]) {
        throw new Error('Invalid round key');
    }
    
    this.rounds[roundKey].status = 'active';
    this.rounds[roundKey].startTime = new Date();
    this.currentRound = roundKey;
    
    return this.save();
};

// Method to complete a round and advance teams
tournamentBracketSchema.methods.completeRound = function(roundKey, results) {
    if (!this.rounds[roundKey]) {
        throw new Error('Invalid round key');
    }
    
    const round = this.rounds[roundKey];
    round.status = 'completed';
    round.endTime = new Date();
    
    // Process results and determine qualified teams
    const qualifiedTeams = [];
    
    if (results && results.length > 0) {
        results.forEach(groupResult => {
            const group = round.groups.find(g => g.groupId === groupResult.groupId);
            if (group) {
                // Update team positions and scores
                groupResult.rankings.forEach(ranking => {
                    const team = round.teams.find(t => t.teamId.equals(ranking.teamId));
                    if (team) {
                        team.score = ranking.score;
                        team.position = ranking.position;
                        team.status = ranking.position <= this.roundConfig[roundKey].qualifyingTeams ? 'qualified' : 'eliminated';
                        
                        if (team.status === 'qualified') {
                            qualifiedTeams.push({
                                teamId: team.teamId,
                                teamName: team.teamName,
                                score: team.score
                            });
                            group.qualifiedTeams.push(team.teamId);
                        }
                    }
                });
            }
        });
    }
    
    // Advance qualified teams to next round
    const nextRoundKey = this.getNextRound(roundKey);
    if (nextRoundKey && qualifiedTeams.length > 0) {
        this.advanceTeamsToNextRound(nextRoundKey, qualifiedTeams);
    }
    
    // Update stats
    this.stats.teamsEliminated += round.teams.filter(t => t.status === 'eliminated').length;
    
    return this.save();
};

// Method to get next round
tournamentBracketSchema.methods.getNextRound = function(currentRound) {
    const roundOrder = ['1', '2', '3', '4', 'final'];
    const currentIndex = roundOrder.indexOf(currentRound);
    return currentIndex < roundOrder.length - 1 ? roundOrder[currentIndex + 1] : null;
};

// Method to advance teams to next round
tournamentBracketSchema.methods.advanceTeamsToNextRound = function(nextRoundKey, qualifiedTeams) {
    if (!this.rounds[nextRoundKey]) return;
    
    const nextRound = this.rounds[nextRoundKey];
    
    // Add qualified teams to next round
    qualifiedTeams.forEach(team => {
        nextRound.teams.push({
            teamId: team.teamId,
            teamName: team.teamName,
            status: 'registered',
            paymentStatus: 'pending',
            groupId: null, // Will be assigned when round starts
            score: 0,
            matches: []
        });
    });
    
    // Create groups for next round if needed
    if (nextRoundKey !== 'final') {
        const teamsPerGroup = this.roundConfig[nextRoundKey].teamsPerGroup;
        const numGroups = Math.ceil(nextRound.teams.length / teamsPerGroup);
        
        nextRound.groups = [];
        for (let i = 0; i < numGroups; i++) {
            const groupTeams = nextRound.teams.slice(i * teamsPerGroup, (i + 1) * teamsPerGroup);
            nextRound.groups.push({
                groupId: i + 1,
                teams: groupTeams.map(t => t.teamId),
                status: 'pending',
                qualifiedTeams: []
            });
            
            // Assign group IDs to teams
            groupTeams.forEach(team => {
                team.groupId = i + 1;
            });
        }
    }
};

// Method to record payment
tournamentBracketSchema.methods.recordPayment = function(teamId, roundKey, amount, status = 'paid') {
    const round = this.rounds[roundKey];
    if (!round) {
        throw new Error('Invalid round key');
    }
    
    const team = round.teams.find(t => t.teamId.equals(teamId));
    if (!team) {
        throw new Error('Team not found in round');
    }
    
    team.paymentStatus = status;
    
    // Update revenue stats
    if (status === 'paid') {
        this.stats.totalRevenue += amount;
        if (this.stats.revenueByRound[roundKey] !== undefined) {
            this.stats.revenueByRound[roundKey] += amount;
        }
    }
    
    return this.save();
};

export const TournamentBracket = mongoose.model('TournamentBracket', tournamentBracketSchema);