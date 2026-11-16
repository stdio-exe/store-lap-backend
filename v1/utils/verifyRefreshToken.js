import pool from "../config/db.js";
import jwt from "jsonwebtoken";
import { SECRET_REFRESH_TOKEN } from "../config/index.js";

const verifyRefreshToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, SECRET_REFRESH_TOKEN);
    const { id } = decoded;

    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);

    if (rows.length === 0) {
      return { message: "TokenInvalid" };
    }
    const user = rows[0];
    const { password, ...data } = user;

    return {
      message: "success",
      data: data,
      payload: decoded,
    };
  } catch (err) {
    return { message: "TokenInvalid" };
  }
};

export { verifyRefreshToken };
