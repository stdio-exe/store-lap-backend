import { Router } from "express";
import Validate from "../middleware/validate.js";
import { Login, Logout } from "../controller/auth.controller.js";
import { check } from "express-validator";

const authRouter = Router();

authRouter.post("/auth/login", Login);
authRouter.get("/auth/logout", Logout);
export default authRouter;
