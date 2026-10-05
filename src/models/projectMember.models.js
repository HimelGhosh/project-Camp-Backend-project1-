import mongoose, { Schema } from 'mongoose';
import {AvailableUserRole,UserRolesEnum} from "../utils/constants.js"

const projectMemberSchema = new Schema({
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    user:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum:UserRolesEnum,
        default: AvailableUserRole.MEMBER
    }
}, {
    timestamps: true    
});

export const ProjectMember = mongoose.model('ProjectMember', projectMemberSchema);


