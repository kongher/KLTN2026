import type { HomeSettings } from "../types/home";

export const EMPTY_HOME_SETTINGS: HomeSettings = {
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

/** Khung trống cho form admin (không dùng dữ liệu mẫu). */
export function createHomeLayoutTemplate(): HomeSettings {
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
    gallery: [],
    testimonials: [],
    promotions: [],
  };
}

export function normalizeHomeSettings(stored?: Partial<HomeSettings> | null): HomeSettings {
  const data = stored || {};
  return {
    ...EMPTY_HOME_SETTINGS,
    ...data,
    aboutPoints: Array.isArray(data.aboutPoints) ? data.aboutPoints : [],
    aboutStats: Array.isArray(data.aboutStats) ? data.aboutStats : [],
    gallery: Array.isArray(data.gallery) ? data.gallery : [],
    testimonials: Array.isArray(data.testimonials) ? data.testimonials : [],
    promotions: Array.isArray(data.promotions) ? data.promotions : [],
    bannerSlides: Array.isArray(data.bannerSlides) ? data.bannerSlides : [],
  };
}

export function phoneHref(phone: string) {
  return `tel:${phone.replace(/\s+/g, "")}`;
}