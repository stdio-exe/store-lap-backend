import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER } from "./index.js";

dotenv.config();

const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Hàm kiểm tra kết nối khi khởi động
const testDBConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Kết nối thành công tới MySQL trên Railway!");
    connection.release();
  } catch (error) {
    console.error("❌ Lỗi kết nối MySQL:", error.message);
  }
};

testDBConnection();

export default pool;
