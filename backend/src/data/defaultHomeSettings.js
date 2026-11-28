/** Giá trị trống — không dùng ảnh/link mẫu từ bên ngoài */
const EMPTY_HOME_SETTINGS = {
  name: "Lumina Spa",
  tagline: "",
  description: "",
  aboutTitle: "",
  aboutDescription: "",
  address: "",
  phone: "",
  email: "",
  hoursWeekday: "",
  hoursWeekend: "",
  mapSrc: "",
  facebook: "",
  instagram: "",
  zalo: "",
  heroImage: "",
  heroVideo: "",
  bannerSlides: [],
  aboutPoints: [],
  aboutStats: [],
  gallery: [],
  testimonials: [],
  promotions: [],
};

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function createHomeLayoutTemplate() {
  return {
    ...EMPTY_HOME_SETTINGS,
    aboutPoints: [
      { title: "", text: "" },
      { title: "", text: "" },
      { title: "", text: "" },
    ],
    aboutStats: [
      { value: "", label: "" },
      { value: "", label: "" },
      { value: "", label: "" },
      { value: "", label: "" },
    ],
    testimonials: [
      {
        id: "testimonial-1",
        rating: 5,
        comment: "",
        customerName: "",
        customerAvatar: "",
        serviceName: "",
      },
      {
        id: "testimonial-2",
        rating: 5,
        comment: "",
        customerName: "",
        customerAvatar: "",
        serviceName: "",
      },
      {
        id: "testimonial-3",
        rating: 5,
        comment: "",
        customerName: "",
        customerAvatar: "",
        serviceName: "",
      },
    ],
    promotions: [
      {
        id: "promotion-1",
        badge: "",
        title: "",
        description: "",
        code: "",
        highlight: "",
      },
      {
        id: "promotion-2",
        badge: "",
        title: "",
        description: "",
        code: "",
        highlight: "",
      },
      {
        id: "promotion-3",
        badge: "",
        title: "",
        description: "",
        code: "",
        highlight: "",
      },
    ],
    gallery: [],
  };
}

/** Chỉ lấy dữ liệu đã lưu; không ghép lại nội dung mock */
function normalizeHomeSettings(stored) {
  const data = stored && typeof stored === "object" ? stored : {};
  return {
    ...EMPTY_HOME_SETTINGS,
    ...data,
    aboutPoints: asArray(data.aboutPoints),
    aboutStats: asArray(data.aboutStats),
    gallery: asArray(data.gallery),
    testimonials: asArray(data.testimonials),
    promotions: asArray(data.promotions),
    bannerSlides: asArray(data.bannerSlides),
  };
}

module.exports = {
  EMPTY_HOME_SETTINGS,
  DEFAULT_HOME_SETTINGS: EMPTY_HOME_SETTINGS,
  createHomeLayoutTemplate,
  normalizeHomeSettings,
  mergeHomeSettings: normalizeHomeSettings,
};