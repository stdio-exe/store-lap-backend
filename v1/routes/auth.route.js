import { Router } from "express";
import { Login, Logout, Register, verifyEmail } from "../controller/auth.controller.js";
import { Verify } from "../middleware/verify.js";

const authRouter = Router();

authRouter.post("/auth/login", Login);
authRouter.get("/auth/logout", Logout);
authRouter.post("/auth/register", Register);
authRouter.get("/auth/verify/:userId/:uniqueStr", verifyEmail);
authRouter.get("/auth/user", Verify, (req, res) => {
  res.status(200).json({
    status: "success",
    data: [req.user],
    message: "Chào mừng bạn đến với StoreLap",
  });
});

export default authRouter;
