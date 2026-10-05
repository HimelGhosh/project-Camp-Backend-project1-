import { validationResult } from "express-validator";
import { ApiError } from "../utils/api-error.js";

export const validate = (req, res, next) => {
    const errors = validationResult(req);
    
    if (errors.isEmpty()) {
        return next(); // FIXED: Added 'return' to stop execution here if valid
    }
    
    const extractedErrors = [];
    errors.array().map((err) =>
        extractedErrors.push({
            [err.path]: err.msg,
        })
    );
    
    // FIXED: Used next(err) instead of throw to properly route to your error handler
    return next(new ApiError(400, "Validation Error", extractedErrors));
};