// src/models/user.model.js

import mongoose, { Schema } from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true // Makes searching by username faster
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        roles: {
            type: [String],
            enum: ['user', 'admin'],
            default: ['user']
        }
    },
    {
        timestamps: true // Automatically adds createdAt and updatedAt fields
    }
);

// Mongoose middleware to hash the password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Custom method to check if the password is correct
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// Custom method to generate a JWT access token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            roles: this.roles
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.TOKEN_EXPIRES_IN
        }
    );
};

export const User = mongoose.model("User", userSchema);