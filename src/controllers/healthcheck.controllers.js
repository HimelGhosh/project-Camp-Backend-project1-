import {ApiResponse} from "../utils/Api-Response.js";
import {asyncHandler} from "../utils/async-handler.js";
// const healthCheck=(req,res)=>{
//     try{
//         res
//         .status(200)
//         .json(new ApiResponse(200,"success"));
//     }
//     catch(error)
//     {
//         console.log("healthcheck Api error",error);
//     }
// }

const healthCheck=asyncHandler(async(req,res)=>{
    res
    .status(200)
    .json(new ApiResponse(200,"success"));
})

export {healthCheck};