// src/controllers/content.controller.js

// GET /api/content/sponsored
exports.sponsored = async (req, res) => {
  try {
    // TODO: Replace with real database queries
    const sponsoredContent = {
      id: 1,
      title: "Elevate Your Game!",
      description: "Join the new season with our exclusive gaming gear and unlock your potential.",
      text: "Discover premium gaming equipment designed for champions. Get the competitive edge you need.",
      buttonText: "Shop Now",
      link: "https://example.com/gaming-gear",
      url: "https://example.com/gaming-gear",
      image: "https://placehold.co/600x400?text=Gaming+Gear+Sale"
    };

    res.json({
      success: true,
      data: sponsoredContent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sponsored content'
    });
  }
};

// GET /api/content/highlights
exports.highlights = async (req, res) => {
  try {
    // TODO: Replace with real database queries
    const highlights = [
      {
        id: 1,
        title: "Epic PUBG Clutch Play",
        videoId: "C28f73G4y80",
        youtubeId: "C28f73G4y80",
        url: "https://www.youtube.com/watch?v=C28f73G4y80"
      },
      {
        id: 2,
        title: "BGMI Championship Highlights",
        videoId: "9w_Y2y_V-94",
        youtubeId: "9w_Y2y_V-94",
        url: "https://www.youtube.com/watch?v=9w_Y2y_V-94"
      },
      {
        id: 3,
        title: "Best Sniper Shots Compilation",
        videoId: "gL91y1b-8_I",
        youtubeId: "gL91y1b-8_I",
        url: "https://www.youtube.com/watch?v=gL91y1b-8_I"
      },
      {
        id: 4,
        title: "Tournament Finals Recap",
        videoId: "w7g9c2P8cWw",
        youtubeId: "w7g9c2P8cWw",
        url: "https://www.youtube.com/watch?v=w7g9c2P8cWw"
      },
      {
        id: 5,
        title: "Pro Player Strategies",
        videoId: "oQJ2v3s22eY",
        youtubeId: "oQJ2v3s22eY",
        url: "https://www.youtube.com/watch?v=oQJ2v3s22eY"
      }
    ];

    res.json({
      success: true,
      data: highlights
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch highlights'
    });
  }
};
