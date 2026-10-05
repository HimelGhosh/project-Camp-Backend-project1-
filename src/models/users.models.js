import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken"; // Fixed: Added missing jwt import

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true  
    },
    avatar: {
        type: {
            url: String,
            localPath: String,
        },
        default: {
            url: `https://placehold.co/600x400`,
            localPath: ""
        }
    },
    fullname: {
        type: String,
        trim: true,
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    refreshToken: {
        type: String,
    },
    forgotPasswordToken: {
        type: String,
    },
    forgotPasswordExpiry: {
        type: Date,
    },
    emailVerificationToken: {
        type: String
    },
    emailVerificationTokenExpiry: {
        type: Date,
    },
}, {
    timestamps: true,
})

// Fixed: Removed 'next' entirely for async Mongoose hooks
userSchema.pre("save", async function() {
    if(this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }   
})

// Fixed: Corrected 'thisn' typo to 'this'
userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password);    
}   

userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    )
}

userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    )   
}

userSchema.methods.generateTemporaryToken = function() {
    const unHashedToken = crypto.randomBytes(16).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(unHashedToken).digest("hex");
    const tokenExpiry = Date.now() + (20 * 60 * 1000);
    return { unHashedToken, hashedToken, tokenExpiry };
}

export const User = mongoose.model("User", userSchema);