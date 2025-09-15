// src/controllers/matches.controller.js

// GET /api/matches/recent
exports.recent = async (req, res) => {
  try {
    // TODO: Replace with real database queries
    const recentMatches = [
      {
        id: 1,
        title: "BGMI 2025 Series Match 1",
        name: "BGMI Championship Finals",
        tournament: "ESL Masters",
        series: "BGMI Championship Series",
        game: "BGMI",
        date: new Date(Date.now() - 86400000), // yesterday
        status: "completed",
        result: "Team Alpha wins",
        winner: "Team Alpha"
      },
      {
        id: 2,
        title: "PUBG Global Series Quarter Finals",
        name: "PUBG Global Quarter Finals",
        tournament: "PUBG Players Tour",
        series: "PUBG Global Series",
        game: "PUBG",
        date: new Date(Date.now() - 172800000), // 2 days ago
        status: "completed",
        result: "Team Beta wins",
        winner: "Team Beta"
      },
      {
        id: 3,
        title: "BGMI Masters Semi Finals",
        name: "BGMI Masters Semi Finals",
        tournament: "BGMI Masters",
        series: "BGMI Championship",
        game: "BGMI",
        date: new Date(Date.now() - 259200000), // 3 days ago
        status: "live",
        result: null,
        winner: null
      }
    ];

    res.json({
      success: true,
      data: recentMatches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent matches'
    });
  }
};

// GET /api/matches/live
exports.live = async (req, res) => {
  try {
    // TODO: Replace with real database queries
    const liveMatches = [
      {
        id: 1,
        team1: "Team Liquid",
        team2: "FaZe Clan",
        tournament: "PUBG Global Championship",
        title: "PUBG Global Championship Finals",
        status: "live",
        tournamentId: "pubg-global-championship",
        tournamentSlug: "pubg-global-championship",
        watchLink: "https://twitch.tv/pubg"
      },
      {
        id: 2,
        team1: "Team Soul",
        team2: "TSM Entity",
        tournament: "BGMI Masters Championship",
        title: "BGMI Masters Finals",
        status: "live",
        tournamentId: "bgmi-masters-championship",
        tournamentSlug: "bgmi-masters-championship",
        watchLink: "https://youtube.com/watch?v=example"
      }
    ];

    res.json({
      success: true,
      data: liveMatches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch live matches'
    });
  }
};

// GET /api/matches/upcoming
exports.upcoming = async (req, res) => {
  try {
    // TODO: Replace with real database queries
    const upcomingMatches = [
      {
        id: 1,
        title: "Grand Final: TBA vs TBA",
        team1: "TBA",
        team2: "TBA",
        tournament: "PUBG Global Series 2025",
        startDate: new Date(Date.now() + 86400000), // tomorrow
        scheduledAt: new Date(Date.now() + 86400000)
      },
      {
        id: 2,
        title: "Qualifier 1: Team Alpha vs Team Beta",
        team1: "Team Alpha",
        team2: "Team Beta",
        tournament: "BGMI Championship Series",
        startDate: new Date(Date.now() + 172800000), // day after tomorrow
        scheduledAt: new Date(Date.now() + 172800000)
      },
      {
        id: 3,
        title: "Semi Final: Team Gamma vs Team Delta",
        team1: "Team Gamma",
        team2: "Team Delta",
        tournament: "PUBG Nations Cup",
        startDate: new Date(Date.now() + 259200000), // 3 days from now
        scheduledAt: new Date(Date.now() + 259200000)
      }
    ];

    res.json({
      success: true,
      data: upcomingMatches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch upcoming matches'
    });
  }
};
