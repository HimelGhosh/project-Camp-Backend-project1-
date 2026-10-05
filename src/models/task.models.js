import mongoose, { Schema } from 'mongoose';
import {TaskStatusEnum,AvailableTaskStatus} from "../utils/constants.js"

const taskSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: TaskStatusEnum,
        default: AvailableTaskStatus.TODO
    },
    project: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    assignedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    attachments: [{
        type:[{
            url: String,
            mimetype: String,
            size: Number,
        }
        ],
        default: []
    }]
}, {
    timestamps: true    
});

export const Task = mongoose.model('Task', taskSchema);