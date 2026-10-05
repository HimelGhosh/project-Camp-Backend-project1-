import { body } from "express-validator";
import {AvailableUserRoles} from "../utils/constants.js";

const userRegisterValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Please enter a valid email address"),
        
        body("username")
            .trim()
            .notEmpty()
            .withMessage("Username is required")
            .isLowercase() // Optional: good practice to force usernames to lowercase
            .withMessage("Username must be lowercase"),
        
        body("password")
            .notEmpty()
            .withMessage("Password is required")
            .isLength({ min: 6 }) // Fixed: matched the length to your message
            .withMessage("Password must be at least 6 characters long"),
    ];
};
const userLoginValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Please enter a valid email address"),
        
        body("password")
            .notEmpty()
            .withMessage("Password is required")
            .isLength({ min: 6 }) // Fixed: matched the length to your message
            .withMessage("Password must be at least 6 characters long"),
    ];
};

const userChangePasswordValidator = () => {
    return [
        body("password")
            .notEmpty()
            .withMessage("Password is required"),
        
        body("newPassword")
            .notEmpty()
            .withMessage("New Password is required")
            
    ]

};

const userForgotPasswordValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Please enter a valid email address"),
    ];
}

const userResetPasswordValidator = () => {
    return [
        body("password")
            .notEmpty()
            .withMessage("Password is required")
    ]
}

const createProjectValidator = () => {
    return [
        body("title")
            .trim()
            .notEmpty()
            .withMessage("Title is required"),
        body("description")
            .trim()
            .notEmpty() 
            .withMessage("Description is required")
    ]
}

const addMemberToProjectValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Please enter a valid email address"),
        body("role")
            .trim()
            .notEmpty()
            .withMessage("Role is required")
            .isIn(AvailableUserRoles)
            .withMessage("Please enter a valid role")
    ]
}
export { userRegisterValidator ,userLoginValidator,userChangePasswordValidator,userForgotPasswordValidator,userResetPasswordValidator,createProjectValidator,addMemberToProjectValidator};