export type HomeReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  customerName: string;
  customerAvatar: string | null;
  serviceName: string | null;
};

export type HomeVoucher = {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usedCount: number;
};

export type AboutPoint = {
  title: string;
  text: string;
};

export type AboutStat = {
  value: string;
  label: string;
};

export type GalleryItem = {
  src: string;
  alt: string;
  caption: string;
  note: string;
};

export type HomeTestimonial = {
  id: string;
  rating: number;
  comment: string;
  customerName: string;
  customerAvatar: string;
  serviceName: string;
};

export type HomePromotion = {
  id: string;
  badge: string;
  title: string;
  description: string;
  code: string;
  highlight: string;
};

export type HomeSettings = {
  name: string;
  tagline: string;
  description: string;
  aboutTitle: string;
  aboutDescription: string;
  address: string;
  phone: string;
  email: string;
  hoursWeekday: string;
  hoursWeekend: string;
  mapSrc: string;
  facebook: string;
  instagram: string;
  zalo: string;
  heroImage: string;
  heroVideo: string;
  aboutPoints: AboutPoint[];
  aboutStats: AboutStat[];
  gallery: GalleryItem[];
  testimonials: HomeTestimonial[];
  promotions: HomePromotion[];
};

export type HomeContent = {
  settings: HomeSettings;
  reviews: HomeReview[];
  vouchers: HomeVoucher[];
};
