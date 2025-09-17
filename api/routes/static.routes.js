// api/routes/static.routes.js

import { Router } from "express";
import path from "path";
import fs from "fs";

const router = Router();

// Health check route for static file serving
router.get('/health', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.json({
    success: true,
    message: 'Static file server is running',
    timestamp: new Date().toISOString()
  });
});

// Route to serve images with proper CORS headers
router.get('/images/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const imagePath = path.join(process.cwd(), 'api', 'public', 'temp', filename);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }
    
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Set appropriate content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp'
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    
    // Set cache headers for better performance
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
    
    // Send the file
    res.sendFile(imagePath);
    
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Handle preflight requests for the images route
router.options('/images/:filename', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.sendStatus(200);
});

export default router;