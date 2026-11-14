import { Router } from "express";
import { Login, Logout, Register, verifyEmail } from "../controller/auth.controller.js";

const authRouter = Router();

authRouter.post("/auth/login", Login);
authRouter.get("/auth/logout", Logout);
authRouter.post("/auth/register", Register);
authRouter.get("/auth/verify/:userId/:uniqueStr", verifyEmail);

export default authRouter;
