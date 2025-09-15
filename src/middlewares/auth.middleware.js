// src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

module.exports = async (req, res, next) => {
  try {
    // Check for Authorization header
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    // Extract token
    const token = header.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access denied. Invalid token format.',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }

    // Verify token
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          error: 'Token has expired. Please log in again.',
          code: 'TOKEN_EXPIRED'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid token. Please log in again.',
          code: 'INVALID_TOKEN'
        });
      } else {
        throw jwtError;
      }
    }

    // Find user
    const user = await User.findById(payload.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not found. Please log in again.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        error: 'Account has been deactivated. Please contact support.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(401).json({ 
        success: false, 
        error: 'Account is temporarily locked due to multiple failed login attempts.',
        code: 'ACCOUNT_LOCKED'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Authentication service error. Please try again.',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};
