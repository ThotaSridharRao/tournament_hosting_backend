// src/controllers/bracket.controller.js
import { Tournament } from '../models/tournament.model.js';
import { TournamentBracket } from '../models/tournamentBracket.model.js';
import { Team } from '../models/team.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Get tournament brackets
const getTournamentBrackets = asyncHandler(async (req, res) => {
    const { tournamentId } = req.params;

    // Find tournament
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
        throw new ApiError(404, "Tournament not found");
    }

    // Find brackets
    const brackets = await TournamentBracket.findOne({ tournament: tournamentId })
        .populate('rounds.1.teams.teamId', 'name')
        .populate('rounds.2.teams.teamId', 'name')
        .populate('rounds.3.teams.teamId', 'name')
        .populate('rounds.4.teams.teamId', 'name')
        .populate('rounds.final.teams.teamId', 'name');

    if (!brackets) {
        throw new ApiError(404, "Tournament brackets not found");
    }

    return res.status(200).json(
        new ApiResponse(200, brackets, "Tournament brackets retrieved successfully")
    );
});

// Initialize tournament brackets
const initializeTournamentBrackets = asyncHandler(async (req, res) => {
    const { tournamentId } = req.params;

    // Find tournament
    const tournament = await Tournament.findById(tournamentId).populate('participants');
    if (!tournament) {
        throw new ApiError(404, "Tournament not found");
    }

    // Check if brackets already exist
    const existingBrackets = await TournamentBracket.findOne({ tournament: tournamentId });
    if (existingBrackets) {
        throw new ApiError(409, "Tournament brackets already exist");
    }

    // Get all registered teams
    const teams = await Team.find({ tournament: tournamentId, status: 'approved' });
    if (teams.length === 0) {
        throw new ApiError(400, "No approved teams found for this tournament");
    }

    // Create new brackets
    const brackets = new TournamentBracket({
        tournament: tournamentId,
        totalTeams: teams.length,
        currentRound: '1',
        status: 'initialized'
    });

    // Initialize with teams
    await brackets.initializeWithTeams(teams);

    // Update tournament reference
    tournament.brackets = brackets._id;
    await tournament.save();

    return res.status(201).json(
        new ApiResponse(201, brackets, "Tournament brackets initialized successfully")
    );
});

// Start a round
const startRound = asyncHandler(async (req, res) => {
    const { tournamentId, roundKey } = req.params;

    // Find brackets
    const brackets = await TournamentBracket.findOne({ tournament: tournamentId });
    if (!brackets) {
        throw new ApiError(404, "Tournament brackets not found");
    }

    // Validate round key
    if (!['1', '2', '3', '4', 'final'].includes(roundKey)) {
        throw new ApiError(400, "Invalid round key");
    }

    // Check if round can be started
    const round = brackets.rounds[roundKey];
    if (!round || round.status !== 'pending') {
        throw new ApiError(400, "Round cannot be started");
    }

    // Start the round
    await brackets.startRound(roundKey);

    return res.status(200).json(
        new ApiResponse(200, brackets, `${brackets.roundConfig[roundKey].name} started successfully`)
    );
});

// Complete a round
const completeRound = asyncHandler(async (req, res) => {
    const { tournamentId, roundKey } = req.params;
    const { results } = req.body;

    // Find brackets
    const brackets = await TournamentBracket.findOne({ tournament: tournamentId });
    if (!brackets) {
        throw new ApiError(404, "Tournament brackets not found");
    }

    // Validate round key
    if (!['1', '2', '3', '4', 'final'].includes(roundKey)) {
        throw new ApiError(400, "Invalid round key");
    }

    // Check if round can be completed
    const round = brackets.rounds[roundKey];
    if (!round || round.status !== 'active') {
        throw new ApiError(400, "Round cannot be completed");
    }

    // Complete the round
    await brackets.completeRound(roundKey, results);

    // Update team statuses in database
    if (results && results.length > 0) {
        for (const groupResult of results) {
            for (const ranking of groupResult.rankings) {
                const team = await Team.findById(ranking.teamId);
                if (team) {
                    team.stats.totalScore += ranking.score || 0;
                    team.stats.matchesPlayed += 1;
                    team.stats.currentRound = roundKey;
                    
                    if (ranking.position <= brackets.roundConfig[roundKey].qualifyingTeams) {
                        team.status = 'active';
                        team.stats.matchesWon += 1;
                    } else {
                        team.status = 'eliminated';
                    }
                    
                    if (!team.stats.bestPosition || ranking.position < team.stats.bestPosition) {
                        team.stats.bestPosition = ranking.position;
                    }
                    
                    await team.save();
                }
            }
        }
    }

    return res.status(200).json(
        new ApiResponse(200, brackets, `${brackets.roundConfig[roundKey].name} completed successfully`)
    );
});

// Record payment
const recordPayment = asyncHandler(async (req, res) => {
    const { tournamentId } = req.params;
    const { teamId, roundKey, amount, status = 'paid', paymentMethod, transactionId } = req.body;

    // Find brackets
    const brackets = await TournamentBracket.findOne({ tournament: tournamentId });
    if (!brackets) {
        throw new ApiError(404, "Tournament brackets not found");
    }

    // Find team
    const team = await Team.findById(teamId);
    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    // Record payment in brackets
    await brackets.recordPayment(teamId, roundKey, amount, status);

    // Record payment in team model
    const existingPayment = team.payments.find(p => p.roundKey === roundKey);
    if (existingPayment) {
        existingPayment.status = status;
        existingPayment.transactionId = transactionId;
        if (status === 'paid') {
            existingPayment.paidAt = new Date();
        }
    } else {
        team.payments.push({
            roundKey,
            amount,
            status,
            transactionId,
            paymentMethod,
            paidAt: status === 'paid' ? new Date() : undefined
        });
    }

    // Update total amount
    if (status === 'paid') {
        team.totalAmount += amount;
    }

    await team.save();

    return res.status(200).json(
        new ApiResponse(200, { teamId, roundKey, amount, status }, "Payment recorded successfully")
    );
});

// Get payment summary
const getPaymentSummary = asyncHandler(async (req, res) => {
    const { tournamentId } = req.params;

    // Find brackets
    const brackets = await TournamentBracket.findOne({ tournament: tournamentId });
    if (!brackets) {
        throw new ApiError(404, "Tournament brackets not found");
    }

    // Get all teams for this tournament
    const teams = await Team.find({ tournament: tournamentId });

    // Calculate payment summary
    const summary = {
        totalCollected: brackets.stats.totalRevenue,
        byRound: {},
        pendingPayments: []
    };

    // Calculate by round
    Object.keys(brackets.roundConfig).forEach(roundKey => {
        const config = brackets.roundConfig[roundKey];
        const roundTeams = brackets.rounds[roundKey]?.teams || [];
        const paidTeams = roundTeams.filter(t => t.paymentStatus === 'paid');
        const pendingTeams = roundTeams.filter(t => t.paymentStatus === 'pending');

        summary.byRound[roundKey] = {
            collected: paidTeams.length * config.entryFee,
            pending: pendingTeams.length * config.entryFee,
            teams: roundTeams.length
        };

        // Add pending payments
        pendingTeams.forEach(team => {
            const teamData = teams.find(t => t._id.equals(team.teamId));
            if (teamData) {
                summary.pendingPayments.push({
                    teamId: team.teamId,
                    teamName: team.teamName,
                    roundKey,
                    amount: config.entryFee
                });
            }
        });
    });

    return res.status(200).json(
        new ApiResponse(200, summary, "Payment summary retrieved successfully")
    );
});

// Update team status
const updateTeamStatus = asyncHandler(async (req, res) => {
    const { tournamentId, teamId } = req.params;
    const { roundKey, status, score, position, paymentStatus } = req.body;

    // Find brackets
    const brackets = await TournamentBracket.findOne({ tournament: tournamentId });
    if (!brackets) {
        throw new ApiError(404, "Tournament brackets not found");
    }

    // Find team in round
    const round = brackets.rounds[roundKey];
    if (!round) {
        throw new ApiError(400, "Invalid round key");
    }

    const team = round.teams.find(t => t.teamId.equals(teamId));
    if (!team) {
        throw new ApiError(404, "Team not found in round");
    }

    // Update team data
    if (status) team.status = status;
    if (score !== undefined) team.score = score;
    if (position !== undefined) team.position = position;
    if (paymentStatus) team.paymentStatus = paymentStatus;

    await brackets.save();

    // Also update team model
    const teamModel = await Team.findById(teamId);
    if (teamModel) {
        if (status) teamModel.status = status;
        if (score !== undefined) teamModel.stats.totalScore = score;
        if (position !== undefined && (!teamModel.stats.bestPosition || position < teamModel.stats.bestPosition)) {
            teamModel.stats.bestPosition = position;
        }
        await teamModel.save();
    }

    return res.status(200).json(
        new ApiResponse(200, team, "Team status updated successfully")
    );
});

export {
    getTournamentBrackets,
    initializeTournamentBrackets,
    startRound,
    completeRound,
    recordPayment,
    getPaymentSummary,
    updateTeamStatus
};