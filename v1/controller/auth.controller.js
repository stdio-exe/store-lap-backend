import pool from "../config/db.js";
import jwt from "jsonwebtoken";
import { NODE_ENV, SECRET_ACCESS_TOKEN, SECRET_REFRESH_TOKEN } from "../config/index.js";
import bcrypt from "bcrypt";
import { sendVerificationEmail } from "../services/resend.service.js";

const Register = async (req, res) => {
  const { fullName, email, password, phone, address } = req.body;

  try {
    // Kiểm tra xem user đã tồn tại trong database chưa
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const existingUser = rows[0];

    if (!existingUser) {
      // Nếu user chưa tồn tại: Mã hóa mật khẩu
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Thêm mới user vào database
      const [result] = await pool.query(
        "INSERT INTO users (fullName, email, password, phone, address, verified) VALUES (?, ?, ?, ?, ?, ?)",
        [fullName, email, hashedPassword, phone || null, address || null, false],
      );

      const userId = result.insertId; // Lấy ID tự động tăng

      // Lấy thông tin user vừa tạo để trả về client
      const [newUserRows] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
      const savedUser = newUserRows[0];

      // Loại bỏ password và role khỏi dữ liệu trả về client
      const { password: pwd, role, ...user_data } = savedUser;

      // Gửi email xác thực
      if (savedUser) {
        await sendVerificationEmail(user_data.id, user_data.email);
      }

      return res.status(200).json({
        status: "success",
        data: [user_data],
        message: "Đăng ký tài khoản thành công. Vui lòng kiểm tra email để xác thực tài khoản!",
      });
    } else if (!existingUser.verified) {
      //  Nếu user tồn tại nhưng chưa verified: Cập nhật lại thông tin mới
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      await pool.query(
        "UPDATE users SET fullName = ?, password = ?, phone = ?, address = ? WHERE id = ?",
        [fullName, hashedPassword, phone || null, address || null, existingUser.id],
      );

      // Lấy thông tin sau khi cập nhật
      const [updatedRows] = await pool.query("SELECT * FROM users WHERE id = ?", [existingUser.id]);
      const savedUser = updatedRows[0];

      const { password: pwd, role, ...user_data } = savedUser;

      if (savedUser) {
        await sendVerificationEmail(user_data.id, user_data.email);
      }

      return res.status(200).json({
        status: "success",
        data: [user_data],
        message: "Đăng ký tài khoản thành công. Vui lòng kiểm tra email để xác thực tài khoản!",
      });
    } else {
      // Nếu đã tồn tại và đã verified rồi
      return res.status(400).json({
        status: "failed",
        data: [],
        message: "Email đã được sử dụng để đăng ký tài khoản. Vui lòng sử dụng email khác!",
      });
    }
  } catch (err) {
    console.error("Register Error:", err);
    return res.status(500).json({
      status: "error",
      code: 500,
      data: [],
      message: "Internal Server Error",
    });
  }
};

const verifyEmail = async (req, res) => {
  const { userId, uniqueStr } = req.params;

  try {
    // Kiểm tra xem bản ghi xác thực có tồn tại không
    const [userVerifyRows] = await pool.query("SELECT * FROM userverification WHERE userId = ?", [
      userId,
    ]);

    if (userVerifyRows.length > 0) {
      const { expireDate, uniqueStr: hashedUniqueStr } = userVerifyRows[0];

      // Kiểm tra hạn sử dụng của link
      if (new Date(expireDate) < new Date()) {
        try {
          // Xóa bản ghi xác thực đã hết hạn
          await pool.query("DELETE FROM userverification WHERE userId = ?", [userId]);

          // Xóa user chưa được xác thực
          await pool.query("DELETE FROM users WHERE id = ?", [userId]);

          return res.json({
            error: "true",
            message: "Liên kết đã hết hạn. Vui lòng đăng ký lại.",
          });
        } catch (error) {
          console.log(error);
          return res.json({
            error: "true",
            message: "Đã xảy ra lỗi",
          });
        }
      } else {
        try {
          // 3. So sánh chuỗi uniqueStr truyền lên với chuỗi đã hash trong database
          const isUniqueStrValid = await bcrypt.compare(uniqueStr, hashedUniqueStr);

          if (isUniqueStrValid) {
            try {
              // Cập nhật trạng thái verified của user thành true
              const [result] = await pool.query("UPDATE users SET verified = true WHERE id = ?", [
                userId,
              ]);

              if (result.affectedRows > 0) {
                // Xóa bản ghi xác thực sau khi hoàn tất
                await pool.query("DELETE FROM userverification WHERE userId = ?", [userId]);
              }

              return res.json({
                error: "false",
                message: "Xác thực thành công. Vui lòng đăng nhập.",
              });
            } catch (error) {
              console.log(error);
              return res.json({
                error: "true",
                message: "Đã xảy ra lỗi khi cập nhật trạng thái xác thực.",
              });
            }
          } else {
            return res.json({
              error: "true",
              message: "Thông tin xác thực không hợp lệ.",
            });
          }
        } catch (error) {
          console.log(error);
          return res.json({
            error: "true",
            message: "Đã xảy ra lỗi khi so sánh mã xác thực.",
          });
        }
      }
    } else {
      return res.json({
        error: "true",
        message:
          "Tài khoản không tồn tại hoặc đã được xác thực trước đó. Vui lòng đăng ký hoặc đăng nhập.",
      });
    }
  } catch (error) {
    console.log(error);
    return res.json({
      error: "true",
      message: "Đã xảy ra lỗi khi kiểm tra bản ghi xác thực người dùng.",
    });
  }
};

const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "false",
        message: "Vui lòng nhập đầy đủ email và mật khẩu!",
      });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(401).json({
        status: "false",
        message: "Email hoặc mật khẩu không chính xác!",
      });
    }

    const user = rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: "false",
        message: "Email hoặc mật khẩu không chính xác!",
      });
    }

    if (user.verified === 0 || user.verified === false) {
      return res.json({
        status: "false",
        message: "Email chưa được xác thực!",
      });
    }

    const payload = {
      id: user.id,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, SECRET_ACCESS_TOKEN, {
      expiresIn: "5m",
      algorithm: "HS256",
    });

    const refreshToken = jwt.sign(payload, SECRET_REFRESH_TOKEN, {
      expiresIn: "7d",
      algorithm: "HS256",
    });
    const isProduction = NODE_ENV === "production";
    let optAccessToken = {
      maxAge: 60 * 5 * 1000, // 5 phút
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "strict",
    };

    let optRefreshToken = {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "strict",
    };

    res.cookie("AccessToken", accessToken, optAccessToken);
    res.cookie("RefreshToken", refreshToken, optRefreshToken);

    const newLastActive = Math.floor(Date.now() / 1000);
    await pool.query("UPDATE users SET lastActive = ? WHERE id = ?", [newLastActive, user.id]);

    const { password: pwd, ...user_data } = user;

    res.status(200).json({
      status: "success",
      data: [user_data],
      message: "Đăng nhập thành công!",
    });
  } catch (err) {
    console.error("Lỗi đăng nhập:", err.message);
    res.status(500).json({
      status: "error",
      message: "Lỗi server nội bộ",
    });
  }
};

const Logout = async (req, res) => {
  try {
    const isProduction = NODE_ENV === "production";

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "strict",
    };

    // Xóa tường minh cả 2 cookie
    res.clearCookie("AccessToken", cookieOptions);
    res.clearCookie("RefreshToken", cookieOptions);
    return res.status(200).json({
      status: "success",
      message: "Đăng xuất thành công!",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};

export { Login, Logout, Register, verifyEmail };
