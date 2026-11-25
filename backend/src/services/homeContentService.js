const prisma = require("../config/prisma");
const { DEFAULT_HOME_SETTINGS, mergeHomeSettings } = require("../data/defaultHomeSettings");

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
      data: { id: HOME_SETTING_ID, data: DEFAULT_HOME_SETTINGS },
    });
  }

  return row;
}

async function getHomeSettings() {
  const row = await getSettingsRecord();
  return mergeHomeSettings(row.data);
}

async function updateHomeSettings(payload) {
  const next = mergeHomeSettings(payload);
  const row = await prisma.siteSetting.upsert({
    where: { id: HOME_SETTING_ID },
    create: { id: HOME_SETTING_ID, data: next },
    update: { data: next },
  });
  return mergeHomeSettings(row.data);
}

async function getHomeContent() {
  const today = startOfToday();

  const [reviews, vouchers, settings] = await Promise.all([
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
    prisma.voucher.findMany({
      where: {
        status: "ACTIVE",
        startDate: { lte: today },
        endDate: { gte: today },
      },
      orderBy: { endDate: "asc" },
      take: 6,
    }),
    getHomeSettings(),
  ]);

  return {
    settings,
    reviews: reviews.map(serializeReview),
    vouchers: vouchers.map(serializeVoucher),
  };
}

module.exports = { getHomeContent, getHomeSettings, updateHomeSettings };
