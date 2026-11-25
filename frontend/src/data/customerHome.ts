import type { HomeSettings } from "../types/home";
import { formatPrice } from "../utils/format";

export const DEFAULT_HOME_SETTINGS: HomeSettings = {
  name: "Lumina Spa",
  tagline: "Không gian thư giãn & tái tạo năng lượng cho riêng bạn",
  description:
    "Lumina Spa đồng hành cùng bạn trên hành trình chăm sóc cơ thể, an tĩnh tâm trí và lấy lại sự cân bằng mỗi ngày.",
  aboutTitle: "Spa thiên nhiên, kỹ thuật chuẩn và không gian riêng tư",
  aboutDescription:
    "Mỗi liệu trình được thiết kế để bạn chậm lại, phục hồi năng lượng và chăm sóc làn da một cách bền vững.",
  address: "48 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
  phone: "0901 234 567",
  email: "hello@luminaspa.vn",
  hoursWeekday: "Thứ 2 – Thứ 7: 09:00 – 18:00",
  hoursWeekend: "Chủ nhật: Nghỉ",
  mapSrc:
    "https://maps.google.com/maps?q=48%20Nguyen%20Hue%2C%20District%201%2C%20Ho%20Chi%20Minh%20City&hl=vi&z=16&output=embed",
  facebook: "https://www.facebook.com/",
  instagram: "https://www.instagram.com/",
  zalo: "https://zalo.me/",
  heroImage:
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=2000&q=80",
  heroVideo: "https://videos.pexels.com/video-files/3752637/3752637-hd_1920_1080_25fps.mp4",
  aboutPoints: [
    {
      title: "Nguyên liệu thiên nhiên",
      text: "Ưu tiên tinh dầu, thảo mộc và mỹ phẩm dịu nhẹ, phù hợp làn da Việt.",
    },
    {
      title: "Kỹ thuật viên chuyên nghiệp",
      text: "Đội ngũ được đào tạo bài bản, tư vấn liệu trình theo tình trạng thực tế.",
    },
    {
      title: "Công nghệ hiện đại",
      text: "Kết hợp massage trị liệu và chăm sóc da với quy trình chuẩn, an toàn.",
    },
  ],
  aboutStats: [
    { value: "5+", label: "Năm kinh nghiệm" },
    { value: "10.000+", label: "Khách hàng hài lòng" },
    { value: "15+", label: "Liệu trình chuyên sâu" },
    { value: "98%", label: "Khách quay lại" },
  ],
  gallery: [
    {
      src: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1400&q=80",
      alt: "Phòng trị liệu ấm áp, riêng tư",
      caption: "Phòng trị liệu riêng tư",
      note: "Không gian yên tĩnh, nhiệt độ vừa phải để cơ thể dễ buông thư.",
    },
    {
      src: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80",
      alt: "Ánh sáng vàng dịu trong không gian spa",
      caption: "Ánh sáng vàng dịu",
      note: "Ánh sáng ấm giúp mắt nghỉ ngơi và dễ đi vào trạng thái thư giãn.",
    },
    {
      src: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=900&q=80",
      alt: "Khu vực chờ spa yên tĩnh",
      caption: "Góc chờ an tĩnh",
      note: "Trà thảo mộc và không gian chờ tách biệt với phố thị.",
    },
    {
      src: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=900&q=80",
      alt: "Tinh dầu và hương thơm thảo mộc",
      caption: "Hương thảo mộc",
      note: "Tinh dầu nhẹ, không nồng, phù hợp cho liệu trình dài.",
    },
  ],
  testimonials: [
    {
      id: "fallback-chi",
      rating: 5,
      comment:
        "Liệu trình rất dễ chịu, da mịn hơn rõ rệt. Không gian sạch sẽ, nhân viên nhẹ nhàng.",
      customerName: "Trần Thị Chi",
      customerAvatar: "https://i.pravatar.cc/150?img=9",
      serviceName: "Tẩy tế bào chết body",
    },
    {
      id: "fallback-em",
      rating: 5,
      comment: "Chuyên viên tư vấn kỹ, mụn giảm sau buổi đầu. Mình sẽ đặt liệu trình tiếp theo.",
      customerName: "Hoàng Thị Em",
      customerAvatar: "https://i.pravatar.cc/150?img=20",
      serviceName: "Facial trị mụn",
    },
    {
      id: "fallback-an",
      rating: 5,
      comment: "Đặt lịch nhanh, phòng ốc ấm áp. Massage giúp mình hết mỏi vai sau một tuần làm việc.",
      customerName: "Nguyễn Thị An",
      customerAvatar: "https://i.pravatar.cc/150?img=5",
      serviceName: "Massage body",
    },
  ],
  promotions: [
    {
      id: "welcome",
      badge: "Khách mới",
      title: "Ưu đãi lần đầu đặt lịch",
      description: "Giảm 10% cho liệu trình đầu tiên khi nhập mã tại bước xác nhận.",
      code: "WELCOME10",
      highlight: "Giảm 10%",
    },
    {
      id: "combo",
      badge: "Combo",
      title: "Massage body + Facial cơ bản",
      description: "Gói thư giãn nửa ngày, phù hợp khi bạn muốn chăm sóc cả cơ thể lẫn làn da.",
      code: "",
      highlight: "Tiết kiệm hơn khi đặt cùng lúc",
    },
    {
      id: "season",
      badge: "Quà tặng",
      title: "Tinh dầu mini cho khách đặt lịch mới",
      description: "Nhận quà chăm sóc tại nhà khi hoàn tất lịch hẹn đầu tiên trong tháng.",
      code: "",
      highlight: "Quà tặng kèm",
    },
  ],
};

export function mergeHomeSettings(stored?: Partial<HomeSettings> | null): HomeSettings {
  const data = stored || {};
  return {
    ...DEFAULT_HOME_SETTINGS,
    ...data,
    aboutPoints: Array.isArray(data.aboutPoints) ? data.aboutPoints : DEFAULT_HOME_SETTINGS.aboutPoints,
    aboutStats: Array.isArray(data.aboutStats) ? data.aboutStats : DEFAULT_HOME_SETTINGS.aboutStats,
    gallery: Array.isArray(data.gallery) ? data.gallery : DEFAULT_HOME_SETTINGS.gallery,
    testimonials: Array.isArray(data.testimonials)
      ? data.testimonials
      : DEFAULT_HOME_SETTINGS.testimonials,
    promotions: Array.isArray(data.promotions) ? data.promotions : DEFAULT_HOME_SETTINGS.promotions,
  };
}

export function phoneHref(phone: string) {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

export function formatVoucherValue(type: "PERCENTAGE" | "FIXED", value: number) {
  if (type === "PERCENTAGE") return `Giảm ${value}%`;
  return `Giảm ${formatPrice(value)}`;
}

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
        body: "Gửi hồ sơ về hello@luminaspa.vn hoặc nhắn Zalo OA / gọi hotline 0901 234 567 (giờ hành chính).",
      },
    ],
  },
} as const;

export type InfoPageKey = keyof typeof INFO_PAGES;
