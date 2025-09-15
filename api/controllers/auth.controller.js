// src/controllers/auth.controller.js

import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';

/**
 * @description Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
const registerUser = asyncHandler(async (req, res) => {
    // 1. Get user details from the request body
    const { username, email, password } = req.body;

    // 2. Validate that no fields are empty
    // Using a simple check here. For more complex validation, we'd use the 'joi' library.
    if ([username, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // 3. Check if a user with the same username or email already exists
    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existingUser) {
        throw new ApiError(409, "User with this email or username already exists"); // 409: Conflict
    }

    // 4. Create a new user object and save it to the database
    // The password will be automatically hashed by the pre-save hook in user.model.js
    const user = await User.create({
        username,
        email,
        password
    });

    // 5. Retrieve the created user from the DB without the password field
    const createdUser = await User.findById(user._id).select("-password");

    // 6. Check if user creation was successful
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    // 7. Send a success response
    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );
});

/**
 * @description Log in an existing user
 * @route POST /api/auth/login
 * @access Public
 */
const loginUser = asyncHandler(async (req, res) => {
    // 1. Get email and password from the request body
    const { email, password } = req.body;

    // 2. Validate that fields are not empty
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    // 3. Find the user by their email
    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    // 4. Check if the provided password is correct using our custom method
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials"); // 401: Unauthorized
    }

    // 5. Generate a JWT access token using our custom method
    const accessToken = user.generateAccessToken();

    // 6. Get user details to send in response (without the password)
    const loggedInUser = await User.findById(user._id).select("-password");

    // 7. Send the response with the token and user data
    return res.status(200).json(
        new ApiResponse(
            200,
            { user: loggedInUser, token: accessToken },
            "User logged in successfully"
        )
    );
});

/**
 * @description Log out a user
 * @route POST /api/auth/logout
 * @access Private (requires authentication)
 */
const logoutUser = asyncHandler(async (req, res) => {
    // Note: For a stateless JWT system, logout is mainly handled on the client-side
    // by deleting the token. This endpoint is a good practice to have.
    // In more advanced setups (with refresh tokens), this endpoint would clear cookies.
    
    return res.status(200).json(new ApiResponse(200, {}, "User logged out successfully"));
});

export {
    registerUser,
    loginUser,
    logoutUser
};