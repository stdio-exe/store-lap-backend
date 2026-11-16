import jwt from "jsonwebtoken";
import { SECRET_ACCESS_TOKEN } from "../config/index.js";
import pool from "../config/db.js";

const verifyAccessToken = async (accessToken) => {
  try {
    const decoded = jwt.verify(accessToken, SECRET_ACCESS_TOKEN);
    const { id } = decoded;

    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);

    if (rows.length === 0) {
      return { message: "TokenInvalid" };
    }

    const user = rows[0];
    const { password, ...data } = user;

    return {
      status: "success",
      data: data,
    };
  } catch (err) {
    if (err.name == "TokenExpiredError") {
      return { message: "TokenExpired" };
    } else if (err.name == "JsonWebTokenError") {
      return { message: "TokenInvalid" };
    }
  }
};

export { verifyAccessToken };
