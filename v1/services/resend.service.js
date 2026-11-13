import { FRONTEND_DEV_URL, FRONTEND_PROD_URL, NODE_ENV } from "../config/index.js";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import pool from "../config/db.js";
import resend from "../config/resend.js";

const sendVerificationEmail = async (_id, email) => {
  try {
    // Kiểm tra và xóa bản ghi xác thực cũ của userId
    await pool.query("DELETE FROM userverification WHERE userId = ?", [_id]);

    const url = NODE_ENV === "development" ? FRONTEND_DEV_URL : FRONTEND_PROD_URL;
    const uniqueStr = uuidv4();

    const mailOptions = {
      from: "Acme <onboarding@resend.dev>",
      to: email,
      subject: "Xác thực tài khoản của bạn",
      html: `<p>Xác thực tài khoản để hoàn tất quá trình đăng ký và đăng nhập vào tài khoản của bạn.</p>
             <p>Link này <b>hết hạn sau 15 phút</b>.</p>
             <p>Nhấn <a href="${url}/verify/${_id}/${uniqueStr}">vào đây</a> để tiếp tục.</p>`,
    };

    // Hash chuỗi uniqueStr bằng bcrypt
    const hashUniqueStr = await bcrypt.hash(uniqueStr, 10);

    // Tính thời gian hết hạn (15 phút sau)
    const expireDate = new Date(Date.now() + 15 * 60 * 1000);

    // Lưu thông tin xác thực vào bảng userverification
    await pool.query(
      "INSERT INTO userverification (userId, uniqueStr, expireDate) VALUES (?, ?, ?)",
      [_id, hashUniqueStr, expireDate],
    );

    // Gửi email qua Resend
    await resend.emails.send(mailOptions);
    console.log("Gửi email xác thực thành công!");
  } catch (error) {
    console.error("Lỗi khi gửi email xác thực:", error);
  }
};

export { sendVerificationEmail };
