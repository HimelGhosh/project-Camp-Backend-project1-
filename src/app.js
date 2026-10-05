import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app=express();
//basic configuration
app.use(express.json({limit:"10mb"}));
app.use(express.urlencoded({extended:true,limit:"10mb"}));
app.use(express.static("public"));
app.use(cookieParser());

//cors configuration
app.use(cors({
    origin:process.env.CORS_ORIGIN?.split(",") || "*",
    methods:["GET","POST","PUT","DELETE","PATCH","OPTIONS"],
    allowedHeaders:["Content-Type","Authorization"]
}));

// importing the routes
import healthcheckRouter from "./routes/healthcheck.router.js";
import authRouter from "./routes/auth.routes.js";
import projectRouter from "./routes/project.routes.js";

app.use("/api/v1/projects",projectRouter);
app.use("/api/v1/healthcheck",healthcheckRouter);
app.use("/api/v1/auth",authRouter);

export default app;