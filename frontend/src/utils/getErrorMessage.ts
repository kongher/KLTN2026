import axios from "axios";

const API_MESSAGE_VI: Record<string, string> = {
  "Email already exists": "Email đã được sử dụng",
  "Phone already exists": "Số điện thoại đã được sử dụng",
  "Invalid or expired verification code": "Mã OTP không đúng hoặc đã hết hạn",
  "Please wait before requesting a new code": "Vui lòng đợi trước khi gửi lại mã OTP",
  "Too many verification requests. Please try again later.":
    "Đã vượt giới hạn gửi mã. Vui lòng thử lại sau.",
  "Verification has expired. Please register again to receive a new code.":
    "Phiên xác thực đã hết hạn. Vui lòng đăng ký lại.",
  "Unable to send verification email. Please try again later.":
    "Không thể gửi email xác thực. Vui lòng thử lại sau.",
  "Email service is not available. Please try again later.":
    "Dịch vụ email chưa được cấu hình. Vui lòng thử lại sau.",
  "Invalid credentials": "Email/SĐT hoặc mật khẩu không đúng",
  "Account is locked": "Tài khoản đã bị khóa hãy liên hệ admin.",
  "Coupon code already exists": "Mã giảm giá đã tồn tại, vui lòng chọn mã khác",
  "Select at least one customer to assign the coupon": "Hãy chọn ít nhất một khách hàng",
  "One or more selected users are not active customers":
    "Một hoặc nhiều tài khoản chọn không phải khách hàng hợp lệ",
  "No customers found for assignment": "Không tìm thấy hồ sơ khách hàng để cấp mã",
  "Start and end dates are required": "Vui lòng nhập ngày bắt đầu và ngày kết thúc",
  "Usage limit must be a positive integer": "Giới hạn lượt dùng phải là số nguyên dương",
  "Database schema is out of date. Run Prisma migrations on the server and restart the backend.":
    "Cơ sở dữ liệu chưa cập nhật migration. Chạy migrate và khởi động lại backend.",
};

export function getErrorMessage(error: unknown, fallback = "Có lỗi xảy ra") {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) {
      return API_MESSAGE_VI[message] || message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
