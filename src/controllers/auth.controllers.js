
import { User } from "../models/users.models.js";
import { ApiResponse } from "../utils/Api-Response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendEmail } from "../utils/mail.js";
import { emailverificationMailgenContent ,forgotPasswordMailgenContent} from "../utils/mail.js";
import jwt from "jsonwebtoken";
const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        
        return { accessToken, refreshToken };
    } catch(error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token");
    }
}

const registerUser = asyncHandler(async (req, res, next) => {    
    const { username, email, password } = req.body;    
    
    const existedUser = await User.findOne({
        $or:[
            { username: username },
            { email: email }
        ]
    });

    if(existedUser){
        return next(new ApiError(400, "User already exists"));
    }

    // FIXED: Changed User.create to new User
    const user = new User({
        email,
        password,
        username,
        isEmailVerified: false
    });
    
    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();
    user.emailVerificationToken = hashedToken;
    user.emailVerificationTokenExpiry = tokenExpiry;

    await user.save({ validateBeforeSave: false });

    await sendEmail({
        email: user?.email,
        subject: "Email Verification",
        mailgenContent: emailverificationMailgenContent(
            user.username, 
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
        )
    });

    const createdUser = await User.findById(user._id).select(
        "-password -emailVerificationToken -emailVerificationTokenExpiry -refreshToken"
    );

    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while creating user");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, "User created successfully", createdUser));
})


const loginUser = asyncHandler(async(req, res, next) => {
    const { email, username, password } = req.body;

    if (!email && !username) {
        return next(new ApiError(400, "Email or username is required"));
    }

    // FIXED: Now searches the database for EITHER email OR username
    const user = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (!user) {
        return next(new ApiError(404, "User not found"));
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);
    
    if (!isPasswordCorrect) {
        return next(new ApiError(401, "Incorrect password"));
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    
    const loggedInUser = await User.findById(user._id).select(
        "-password -emailVerificationToken -emailVerificationTokenExpiry "
    );

    // FIXED: Safely defining maxAge in raw milliseconds (e.g., 1 day for access, 10 days for refresh)
    const accessTokenOptions = {
        httpOnly: true,
        secure: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 Day in ms
    };

    const refreshTokenOptions = {
        httpOnly: true,
        secure: true,
        maxAge: 10 * 24 * 60 * 60 * 1000 // 10 Days in ms
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, accessTokenOptions)
        .cookie("refreshToken", refreshToken, refreshTokenOptions)
        .json(new ApiResponse(200, "Login successful", loggedInUser));
});

const logoutUser=asyncHandler(async(req,res)=>{
   await User.findOneAndUpdate(
        { _id: req.user._id },
        { refreshToken: "" }
    );
    const options={
        httpOnly: true,
        secure: true,
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "Logout successful"));
})

const getCurrentUser = asyncHandler(async (req, res, next) => {
    return res
        .status(200)
        .json(new ApiResponse(200, "Success in fetching current user", req.user));
})

const verifyEmail=asyncHandler(async(req,res)=>{
    const { unHashedToken } = req.params; 
    if(!unHashedToken) {
        return next(new ApiError(400, "unhashed token is required"));
    }

    const hashedToken = crypto.createHash("sha256").update(unHashedToken).digest("hex");
    

    const user=await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationTokenExpiry: { $gt: Date.now() }
    });

    if(!user) {
        return next(new ApiError(400, "Invalid token"));
    }

    user.emailVerificationToken = null;
    user.emailVerificationTokenExpiry = null;
    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });
    return res
    .status(200)
    .json(new ApiResponse(200, "Email verified successfully"));
})

const resendEmailVerification=asyncHandler(async(req,res)=>{
  

    const user = await User.findById(req.user._id)

    if(!user) {
        throw new ApiError(404, "User not found");
    }

    if(user.isEmailVerified) {
        throw new ApiError(400, "Email already verified");
    }
    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();
    user.emailVerificationToken = hashedToken;
    user.emailVerificationTokenExpiry = tokenExpiry;

    await user.save({ validateBeforeSave: false });

    await sendEmail({
        email: user?.email,
        subject: "Email Verification",
        mailgenContent: emailverificationMailgenContent(
            user.username, 
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
        )
    });
    return res
            .status(200)
            .json(new ApiResponse(200, "Email verification link re-sent successfully"));

})

const refreshAccessToken = asyncHandler(async (req, res, next) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        return next(new ApiError(401, "Unauthorized request"));
    }

    try {
        // 1. Verify token signature & expiration
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        // 2. Retrieve user and verify token matches what is stored in DB
        const user = await User.findById(decodedToken?._id);

        if (!user || user.refreshToken !== incomingRefreshToken) {
            return next(new ApiError(401, "Invalid or expired refresh token"));
        }

        // 3. Generate new access and refresh tokens
        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id);
        // 4. Set cookies
        const accessTokenOptions = {
            httpOnly: true,
            secure: false, // Set to false for localhost dev
            maxAge: 24 * 60 * 60 * 1000 // 1 Day
        };

        const refreshTokenOptions = {
            httpOnly: true,
            secure: false, // Set to false for localhost dev
            maxAge: 10 * 24 * 60 * 60 * 1000 // 10 Days
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, accessTokenOptions)
            .cookie("refreshToken", newRefreshToken, refreshTokenOptions)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed successfully"
                )
            );
    } catch (error) {
        return next(new ApiError(401, error?.message || "Invalid refresh token"));
    }
});

const forgotpassword=asyncHandler(async(req,res)=>{
    const {email}=req.body;

    const user=await User.findOne({email});
    if(!user) {
        throw new ApiError(404, "User not found");
    }

    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();
    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordExpiry = tokenExpiry;
    await user.save({ validateBeforeSave: false });

    await sendEmail({
        email: user?.email,
        subject: "Password Reset",
        mailgenContent: forgotPasswordMailgenContent(
            user.username, 
            `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`
        )
    });
    return res
            .status(200)
            .json(new ApiResponse(200, "Password reset link sent successfully"));   
})

const resetpassword=asyncHandler(async(req,res)=>{
    const {resetToken}=req.params;
    const {password}=req.body;

    let hashedToken=crypto.createHash("sha256").update(resetToken).digest("hex");

    const user=await User.findOne({forgotPasswordToken:hashedToken,
        forgotPasswordExpiry: { $gt: Date.now() }
    });
    if(!user) {
        throw new ApiError(404, "User not found");
    }
    user.forgotPasswordExpiry=undefined;
    user.forgotPasswordToken=undefined;
    user.password=password;
    await user.save({ validateBeforeSave: false });
    return res
            .status(200)
            .json(new ApiResponse(200, "Password reset successfully"));

})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body;
    const user=await User.findById(req.user._id);
    if(!user) {
        throw new ApiError(404, "User not found");
    }
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword);
    if(!isPasswordCorrect) {
        throw new ApiError(401, "Incorrect password");
    }
    user.password=newPassword;
    await user.save({ validateBeforeSave: false });
    return res
            .status(200)
            .json(new ApiResponse(200, "Password changed successfully"));       
})
export { registerUser, loginUser, logoutUser ,getCurrentUser, verifyEmail, resendEmailVerification, refreshAccessToken, forgotpassword, resetpassword, changeCurrentPassword};