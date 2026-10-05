import { Project } from "../models/project.models.js";
import {ProjectMember} from "../models/project-member.models.js";

import { ApiResponse } from "../utils/Api-Response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import {userRolesEnum} from "../utils/constants.js";


const getProjects=asyncHandler(async (req, res) => {
    //grab the projects created by the user
    const projects=await ProjectMember.aggregate([
        {
            $match: { user: new mongoose.Types.ObjectId(req.user._id) }
        },
        {
            $lookup: {
                from: "projects",
                localField: "projectId",
                foreignField: "_id",
                as: "projects",
            pipeline: [
                {
                    $lookup:{
                        from:"projectmembers",
                        localField:"_id",
                        foreignField:"projectId",
                        as:"projectmembers"
                    }
                },
                {
                    addFields:{
                        members:{
                            $size:"$projectmembers"
                        }
                    }
                 }
                ]
        }
        },
        {
            $unwind: "$projects"
        },
        {
            $project: {
                project:{
                    _id:1,
                    title:1,
                    description:1,
                    createdBy:1,
                    members:1,
                    createdAt:1,
                    updatedAt:1
                }
                },
            role: 1,
            _id: 0,
        }
    ])

    return res.status(200).json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

const createProject=asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    const project = await Project.create({
        title,
        description,
        createdBy: new mongoose.Types.ObjectId(req.user._id)
    })

    await ProjectMember.create({
        projectId: new mongoose.Types.ObjectId(project._id),
        user: new mongoose.Types.ObjectId(req.user._id),
        role: userRolesEnum.ADMIN
    })

    return res.status(201).json(new ApiResponse(201, project, "Project created successfully"));
});


const getProjectById=asyncHandler(async (req, res) => {
    const {projectId} = req.params;

    const project = await Project.findOne({ _id: mongoose.Types.ObjectId(projectId) });
    if(!project){    
        throw new ApiError(404, "Project not found");
    }
    return res.status(200).json(new ApiResponse(200, project, "Project fetched successfully"));
});

const updateProject=asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const {projectId} = req.params;

    const project = await Project.findOneAndUpdate(
        { _id: mongoose.Types.ObjectId(projectId) },
        { title, description },
        { new: true }
    );
    if(!project){    
        throw new ApiError(404, "Project not found");
    }
    return res.status(200).json(new ApiResponse(200, project, "Project updated successfully"));
});

const deleteProject=asyncHandler(async (req, res) => {
    const {projectId} = req.params;

    const project = await Project.findOneAndDelete(
        { _id: mongoose.Types.ObjectId(projectId) }
    );
    if(!project){    
        throw new ApiError(404, "Project not found");
    }
    return res.status(200).json(
        new ApiResponse(200, project, "Project deleted successfully")
    )
});

const addMemberToProject=asyncHandler(async (req, res) => {
    const {projectId} = req.params;
    const {email,role} = req.body;

    const project = await Project.findOne({ _id: mongoose.Types.ObjectId(projectId) });
    if(!project){    
        throw new ApiError(404, "Project not found");
    }
    const user = await User.findOne({ email });
    if(!user){    
        throw new ApiError(404, "User not found");
    }
    const projectMember = await ProjectMember.findByIdAndUpdate(
        { projectId: mongoose.Types.ObjectId(projectId), user: mongoose.Types.ObjectId(user._id) },
        { role },
        { upsert: true, new: true }
    );
    if(!projectMember){    
        throw new ApiError(404, "Project member not found");
    }

    return res.status(200).json(new ApiResponse(200, projectMember, "Member added to project successfully"));

});

const getProjectMembers=asyncHandler(async (req, res) => {
    const {projectId} = req.params;

    const projectMembers = await ProjectMember.aggregate([
        {
            $match: { projectId: new mongoose.Types.ObjectId(projectId) }
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "users",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            email: 1,
                            role: 1,
                            _id: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                user: { $arrayElemAt: ["$users", 0] }
            }
        }
        ,{
            $project: {
                projectId: 1,
                user: 1,
                role: 1,
                createdAt: 1,
                updatedAt: 1,
                _id: 0
            }
        }
    ])
        if(!projectMembers){    
            throw new ApiError(404, "Project members not found");
        }
        else{
            return res.status(200).json(new ApiResponse(200, projectMembers, "Project members fetched successfully"));   
        }
});

const updateMemberRole=asyncHandler(async (req, res) => {
    const {projectId,userId} = req.params;
    const {role} = req.body;
    
    if(!AvailableRoles.includes(role)){
        throw new ApiError(400, "Invalid role");
    }

    const projectMember = await ProjectMember.findOneAndUpdate(
        { projectId: mongoose.Types.ObjectId(projectId), user: mongoose.Types.ObjectId(userId) },
        { role },
        { new: true }
    );
    if(!projectMember){    
        throw new ApiError(404, "Project member not found");
    }
    return res.status(200).json(
        new ApiResponse(200, projectMember, "Member role updated successfully") 

    )

});

const deleteMember=asyncHandler(async (req, res) => {
    const {projectId,userId} = req.params;

    const projectMember = await ProjectMember.findOneAndDelete(
        { projectId: mongoose.Types.ObjectId(projectId), user: mongoose.Types.ObjectId(userId) }
    );
    if(!projectMember){    
        throw new ApiError(404, "Project member not found");
    }
    return res.status(200).json(
        new ApiResponse(200, projectMember, "Member deleted successfully")
    )
});


export { getProjects, createProject, getProjectById, updateProject, deleteProject, addMemberToProject, getProjectMembers, updateMemberRole, deleteMember };


