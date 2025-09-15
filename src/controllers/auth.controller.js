// src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Helper function to sign JWT tokens
const signToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email,
      username: user.username 
    }, 
    process.env.JWT_SECRET, 
    {
      expiresIn: process.env.TOKEN_EXPIRES_IN || '7d'
    }
  );
};

// Helper function to format user response
const formatUserResponse = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  avatarUrl: user.avatarUrl,
  roles: user.roles,
  createdAt: user.createdAt
});

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check if email already exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email already registered',
        field: 'email'
      });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
    if (existingUsername) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username already taken',
        field: 'username'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({ 
      username: username.trim(),
      email: email.toLowerCase().trim(),
      passwordHash 
    });

    // Generate token
    const token = signToken(user);

    // Log successful registration
    console.log(`✅ New user registered: ${user.email} (${user.username})`);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { 
        user: formatUserResponse(user), 
        token 
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    
    // Handle MongoDB duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
        field: field
      });
    }
    
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Find user by email (case insensitive)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password',
        field: 'email'
      });
    }

    // Check if account is deactivated
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
        error: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.',
        code: 'ACCOUNT_LOCKED',
        lockUntil: user.lockUntil
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();
      
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password',
        field: 'password'
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Generate token with different expiry based on rememberMe
    const tokenExpiry = rememberMe ? '30d' : '7d';
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        username: user.username 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: tokenExpiry }
    );

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Log successful login
    console.log(`✅ User logged in: ${user.email} (Remember: ${rememberMe || false})`);

    return res.json({
      success: true,
      message: 'Login successful',
      data: { 
        user: formatUserResponse(user), 
        token,
        expiresIn: tokenExpiry,
        rememberMe: rememberMe || false
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    next(err);
  }
};

// GET /api/auth/me
exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.json({ 
      success: true, 
      data: formatUserResponse(user)
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
exports.logout = async (req, res, next) => {
  try {
    // In a more advanced setup, you might want to blacklist the token
    // For now, we'll just return success and let the client handle token removal
    
    console.log(`✅ User logged out: ${req.user.email}`);
    
    return res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh
exports.refreshToken = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Generate new token
    const token = signToken(user);

    return res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: { 
        user: formatUserResponse(user), 
        token 
      }
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/check-email
exports.checkEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    return res.json({
      success: true,
      data: {
        available: !existingUser,
        exists: !!existingUser
      }
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/check-username
exports.checkUsername = async (req, res, next) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username is required'
      });
    }

    const existingUser = await User.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') } 
    });
    
    return res.json({
      success: true,
      data: {
        available: !existingUser,
        exists: !!existingUser
      }
    });
  } catch (err) {
    next(err);
  }
};
