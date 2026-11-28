/** Nội dung tĩnh cho trang thông tin khách (chính sách, điều khoản, tuyển dụng). */
export const INFO_PAGES = {
  policy: {
    title: "Chính sách bảo mật",
    intro: "Lumina Spa cam kết bảo vệ thông tin cá nhân của khách hàng khi sử dụng hệ thống đặt lịch.",
    sections: [
      {
        heading: "Thông tin chúng tôi thu thập",
        body: "Họ tên, số điện thoại, email, lịch sử đặt lịch và hồ sơ điều trị phục vụ việc chăm sóc và liên hệ xác nhận lịch hẹn.",
      },
      {
        heading: "Mục đích sử dụng",
        body: "Dữ liệu chỉ dùng để quản lý lịch hẹn, tư vấn liệu trình, chăm sóc sau dịch vụ và cải thiện trải nghiệm. Chúng tôi không bán thông tin cho bên thứ ba.",
      },
      {
        heading: "Bảo mật",
        body: "Tài khoản được bảo vệ bằng mật khẩu mã hóa. Bạn có thể cập nhật hồ sơ hoặc liên hệ hotline khi cần chỉnh sửa / xóa dữ liệu trong phạm vi pháp luật cho phép.",
      },
    ],
  },
  terms: {
    title: "Điều khoản sử dụng",
    intro: "Khi đăng nhập và đặt lịch trên hệ thống Lumina Spa, bạn đồng ý với các điều khoản dưới đây.",
    sections: [
      {
        heading: "Đặt lịch và xác nhận",
        body: "Lịch hẹn có hiệu lực sau khi được tiếp nhận / xác nhận. Vui lòng có mặt trước giờ hẹn 10 phút và mang theo thông tin đã đăng ký.",
      },
      {
        heading: "Đổi lịch và hủy lịch",
        body: "Bạn nên hủy hoặc đổi lịch trước giờ hẹn để chuyên viên sắp xếp lại. Lịch hủy sát giờ có thể ảnh hưởng đến ưu đãi đang áp dụng.",
      },
      {
        heading: "Sức khỏe và an toàn",
        body: "Hãy thông báo tình trạng da, dị ứng hoặc chống chỉ định trước liệu trình. Spa có quyền từ chối dịch vụ nếu không đảm bảo an toàn cho khách.",
      },
    ],
  },
  careers: {
    title: "Tuyển dụng",
    intro: "Lumina Spa tìm đồng nghiệp yêu thích chăm sóc sức khỏe, có thái độ tận tâm và muốn phát triển nghề spa.",
    sections: [
      {
        heading: "Vị trí đang quan tâm",
        body: "Kỹ thuật viên chăm sóc da, kỹ thuật viên massage trị liệu, lễ tân tư vấn. Ưu tiên ứng viên có chứng chỉ nghề hoặc kinh nghiệm thực tế.",
      },
      {
        heading: "Quyền lợi",
        body: "Đào tạo nội bộ, lịch làm việc rõ ràng, môi trường chuyên nghiệp và cơ hội nâng bậc kỹ năng theo lộ trình.",
      },
      {
        heading: "Ứng tuyển",
        body: "Gửi hồ sơ qua email hoặc liên hệ hotline được hiển thị trên trang chủ.",
      },
    ],
  },
} as const;

export type InfoPageKey = keyof typeof INFO_PAGES;