// src/controllers/user.controller.js

import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';

/**
 * @description Get all users (Admin only)
 * @route GET /api/users
 * @access Private (Admin)
 */
const getAllUsers = asyncHandler(async (req, res) => {
    // Find all users and exclude the password field from the result for security
    const users = await User.find({}).select("-password");

    return res.status(200).json(
        new ApiResponse(200, users, "Users fetched successfully")
    );
});

/**
 * @description Update a user's role (Admin only)
 * @route PATCH /api/users/:id/role
 * @access Private (Admin)
 */
const updateUserRole = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { roles } = req.body; // Expecting an array, e.g., ["user", "admin"]

    if (!roles || !Array.isArray(roles)) {
        throw new ApiError(400, "Roles must be provided as an array.");
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
            $set: { roles }
        },
        { new: true }
    ).select("-password");

    if (!updatedUser) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedUser, "User role updated successfully")
    );
});

/**
 * @description Delete a user (Admin only)
 * @route DELETE /api/users/:id
 * @access Private (Admin)
 */
const deleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Note: In a real-world app, you might want to handle what happens to
    // content created by this user (e.g., reassign tournaments, delete teams).

    return res.status(200).json(
        new ApiResponse(200, {}, "User deleted successfully")
    );
});

export {
    getAllUsers,
    updateUserRole,
    deleteUser
};