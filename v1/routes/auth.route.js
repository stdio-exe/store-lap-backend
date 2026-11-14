import { Router } from "express";
import { Login, Logout, Register } from "../controller/auth.controller.js";

const authRouter = Router();

authRouter.post("/auth/login", Login);
authRouter.get("/auth/logout", Logout);
authRouter.post("/auth/register", Register);
export default authRouter;
