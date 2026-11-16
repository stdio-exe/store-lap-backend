import jwt from "jsonwebtoken";
import { NODE_ENV, SECRET_ACCESS_TOKEN } from "../config/index.js";
import pool from "../config/db.js";
import { verifyRefreshToken } from "../utils/verifyRefreshToken.js";
import { verifyAccessToken } from "../utils/verifyAccessToken.js";

export async function Verify(req, res, next) {
  try {
    if (!req.cookies) return res.sendStatus(401);

    const accessToken = req.cookies.AccessToken;
    const refreshToken = req.cookies.RefreshToken;
    const isProduction = NODE_ENV === "production";

    if (accessToken) {
      const resultAccessToken = await verifyAccessToken(accessToken);

      if (resultAccessToken.message == "TokenInvalid") {
        return res.status(401).json({ message: "Chưa xác thực" });
      }
      req.user = resultAccessToken.data;
    } else {
      if (!refreshToken) {
        return res.status(401).json({ message: "Chưa xác thực" });
      }

      const resultRefreshToken = await verifyRefreshToken(refreshToken);

      if (resultRefreshToken.message == "TokenInvalid") {
        return res.status(401).json({ message: "Chưa xác thực" });
      } else {
        let optAccessToken = {
          maxAge: 60 * 5 * 1000, // Hết hạn sau 5 phút
          httpOnly: true, // Cookie chỉ có thể truy cập bởi web server
          secure: isProduction,
          sameSite: isProduction ? "none" : "strict",
        };

        const { iat, exp, ...payload } = resultRefreshToken.payload;
        const newAccessToken = jwt.sign(payload, SECRET_ACCESS_TOKEN, {
          expiresIn: "5m",
          algorithm: "HS256",
        });

        res.cookie("AccessToken", newAccessToken, optAccessToken);

        const elapse = Math.floor(Date.now() / 1000);
        if (elapse - resultRefreshToken.data.lastActive >= 5 * 60) {
          resultRefreshToken.data.lastActive = elapse;

          // Cập nhật last_active trong MySQL
          await pool.query("UPDATE users SET lastActive = ? WHERE id = ?", [
            elapse,
            resultRefreshToken.data.id,
          ]);
        }
        req.user = resultRefreshToken.data;
      }
    }
    next();
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "error",
      code: 500,
      data: [],
      message: "Lỗi hệ thống",
    });
  }
}
