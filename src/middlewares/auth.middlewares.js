import jwt from "jsonwebtoken"; // Added missing import
import { ProjectMember } from "../models/project-members.models.js";

import { User } from "../models/users.models.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    // Optional chaining prevents TypeError if Authorization header is missing
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        return next(new ApiError(401, "Unauthorized request"));
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select(
            "-password -emailVerificationToken -emailVerificationTokenExpiry"
        );

        if (!user) {
            return next(new ApiError(401, "Invalid access token"));
        }

        req.user = user;
        next();
    } catch (error) {
        return next(new ApiError(401, error?.message || "Invalid access token"));
    }
});

// it will take an array as input with the roles that are allowed to access the route
export const validateProjectpermission = (roles=[]) => {
    asyncHandler(async (req, res, next) => {
        const {projectId} = req.params;
        if(!projectId){
            throw new ApiError(400, "Project ID is required");
        }
        const projectMember = await ProjectMember.findOne({ projectId: mongoose.Types.ObjectId(projectId), user: mongoose.Types.ObjectId(req.user._id) });
        if(!projectMember){    
            throw new ApiError(404, "Project member not found");
        }
        const givenRole=projectMember.role;
        if(!roles.includes(givenRole)){
            throw new ApiError(403, "You don't have permission to access this resource");
        }
        next();

    })
}