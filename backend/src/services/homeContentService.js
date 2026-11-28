const prisma = require("../config/prisma");
const AppError = require("../utils/appError");
const {
  createHomeLayoutTemplate,
  normalizeHomeSettings,
} = require("../data/defaultHomeSettings");

const MAX_BANNER_SLIDES = 12;

function normalizeBannerSlides(slides) {
  if (slides === undefined) return undefined;
  if (!Array.isArray(slides)) {
    throw new AppError("bannerSlides must be an array", 400);
  }
  if (slides.length > MAX_BANNER_SLIDES) {
    throw new AppError(`Tối đa ${MAX_BANNER_SLIDES} ảnh banner`, 400);
  }

  const usedOrders = new Set();
  const normalized = slides.map((raw, index) => {
    const image = String(raw?.image || "").trim();
    const sortOrder = Number(raw?.sortOrder);
    if (!image) {
      throw new AppError(`Ảnh banner #${index + 1} là bắt buộc`, 400);
    }
    if (!Number.isInteger(sortOrder) || sortOrder < 1) {
      throw new AppError(`Số thứ tự banner #${index + 1} phải là số nguyên ≥ 1`, 400);
    }
    if (usedOrders.has(sortOrder)) {
      throw new AppError("Số thứ tự banner không được trùng nhau", 409);
    }
    usedOrders.add(sortOrder);

    const id = String(raw?.id || "").trim() || `banner-${sortOrder}`;
    const alt = String(raw?.alt || "").trim().slice(0, 200);

    return { id, image, sortOrder, alt };
  });

  return normalized.sort((a, b) => a.sortOrder - b.sortOrder);
}

const HOME_SETTING_ID = "home";

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function serializeReview(review) {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    customerName: review.customer?.user?.name || "Khách hàng",
    customerAvatar: review.customer?.user?.avatar || null,
    serviceName: review.service?.name || null,
  };
}

function serializeVoucher(voucher) {
  return {
    id: voucher.id,
    code: voucher.code,
    type: voucher.type,
    value: Number(voucher.value),
    startDate: voucher.startDate,
    endDate: voucher.endDate,
    usageLimit: voucher.usageLimit,
    usedCount: voucher.usedCount,
  };
}

async function getSettingsRecord() {
  let row = await prisma.siteSetting.findUnique({
    where: { id: HOME_SETTING_ID },
  });

  if (!row) {
    row = await prisma.siteSetting.create({
      data: { id: HOME_SETTING_ID, data: createHomeLayoutTemplate() },
    });
  }

  return row;
}

async function getHomeSettings() {
  const row = await getSettingsRecord();
  return normalizeHomeSettings(row.data);
}

async function updateHomeSettings(payload) {
  const bannerSlides = normalizeBannerSlides(payload?.bannerSlides);
  const next = normalizeHomeSettings({
    ...payload,
    ...(bannerSlides !== undefined ? { bannerSlides } : {}),
  });
  const row = await prisma.siteSetting.upsert({
    where: { id: HOME_SETTING_ID },
    create: { id: HOME_SETTING_ID, data: next },
    update: { data: next },
  });
  return normalizeHomeSettings(row.data);
}

async function getHomeContent() {
  const today = startOfToday();

  const [reviews, settings] = await Promise.all([
    prisma.review.findMany({
      where: {
        status: "VISIBLE",
        rating: { gte: 4 },
        comment: { not: null },
      },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      take: 6,
      include: {
        customer: {
          include: {
            user: { select: { name: true, avatar: true } },
          },
        },
        service: { select: { name: true } },
      },
    }),
    getHomeSettings(),
  ]);

  return {
    settings,
    reviews: reviews.map(serializeReview),
  };
}

module.exports = { getHomeContent, getHomeSettings, updateHomeSettings };
