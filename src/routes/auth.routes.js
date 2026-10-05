import { Router } from "express";
import {validate} from "../middlewares/validator.middlewares.js";
import { userRegisterValidator } from "../validators/index.js";
import { registerUser } from "../controllers/auth.controllers.js";
import { loginUser } from "../controllers/auth.controllers.js";
import { userLoginValidator } from "../validators/index.js";

import { logoutUser } from "../controllers/auth.controllers.js";

import {verifyJWT} from "../middlewares/auth.middlewares.js";

import {verifyEmail} from "../controllers/auth.controllers.js";

import {resendEmailVerification} from "../controllers/auth.controllers.js";
import {refreshAccessToken} from "../controllers/auth.controllers.js";
import { forgotpassword } from "../controllers/auth.controllers.js";

import { userForgotPasswordValidator } from "../validators/index.js";

import{userResetPasswordValidator} from "../validators/index.js";
import {resetpassword} from "../controllers/auth.controllers.js";
import {changeCurrentPassword} from "../controllers/auth.controllers.js";
import { getCurrentUser } from "../controllers/auth.controllers.js";
import { userChangePasswordValidator } from "../validators/index.js";


const router = Router();
//unsecure
router.route("/register").post(
userRegisterValidator(),validate,registerUser);
router.route("/login").post(userLoginValidator(),validate,loginUser);
router.route("/verify-email/:unHashedToken").get(verifyEmail);
router.route("/refresh-token").post(verifyJWT,refreshAccessToken);
router.route("/resend-verification-email").post(verifyJWT,resendEmailVerification);
router.route("/forgot-password").post( userForgotPasswordValidator(),validate,forgotpassword);
router.route("/reset-password/:resetToken").post( userResetPasswordValidator(),validate,resetpassword);

//secure routes
router.route("/logout").post( verifyJWT,logoutUser);

router.route("/current-user").get(verifyJWT,getCurrentUser);

router.route("/change-password").post(verifyJWT,userChangePasswordValidator(),validate,changeCurrentPassword);





export default router;
