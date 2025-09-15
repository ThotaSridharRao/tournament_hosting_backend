const express = require("express");
const Tournament = require("../models/Tournament");

const router = express.Router();

// GET all tournaments
router.get("/", async (req, res) => {
  try {
    const tournaments = await Tournament.find().sort({ createdAt: -1 });
    res.json({ success: true, data: tournaments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single tournament by slug
router.get("/:slug", async (req, res) => {
  try {
    const tournament = await Tournament.findOne({ slug: req.params.slug });
    if (!tournament) {
      return res.status(404).json({ success: false, error: "Not found" });
    }
    res.json({ success: true, data: tournament });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create tournament
router.post("/", async (req, res) => {
  try {
    const tournament = new Tournament(req.body);
    await tournament.save();
    res.status(201).json({ success: true, data: tournament });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
