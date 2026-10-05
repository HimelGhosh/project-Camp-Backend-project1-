import { Router } from "express";
import {validate} from "../middlewares/validator.middlewares.js";
import {createProjectValidator,addMemberToProjectValidator} from "../validators/index.js";
import {UserRolesEnum,AvailableUserRole} from "../utils/constants.js";

import { getProjects, createProject, getProjectById, updateProject, deleteProject, addMemberToProject, getProjectMembers, updateMemberRole, deleteMember} from "../controllers/project.controllers.js";

import {validateProjectpermission, verifyJWT} from "../middlewares/auth.middlewares.js";
import { AvailableUserRole } from "../utils/constants";
const router = Router();

router.use(verifyJWT); // Apply JWT verification middleware to all routes

router.route("/")
      .get(getProjects)
      .post(createProjectValidator(), validate, createProject);

router.route("/:projectId")
      .get(validateProjectpermission(AvailableUserRole), getProjectById)
      .put(validateProjectpermission([UserRolesEnum.ADMIN]),
      createProjectValidator(),
      validate,
      updateProject)
      .delete(validateProjectpermission([UserRolesEnum.ADMIN]), deleteProject);

      router.route("/:projectId/members")
      .get(getProjectMembers)
      .post(
        validateProjectpermission([UserRolesEnum.ADMIN]),
        addMemberToProjectValidator(),
        validate,
        addMemberToProject
      );

router.route("/:projectId/members/:userId")
        .put( validateProjectpermission([UserRolesEnum.ADMIN]),updateMemberRole)
        .delete(validateProjectpermission([UserRolesEnum.ADMIN]), deleteMember);

export default router;
        


