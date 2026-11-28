const prisma = require("../config/prisma");
const AppError = require("../utils/appError");
const { parsePagination, buildPagination } = require("../utils/query");
const {
  computeDiscountAmount,
  formatDiscountLabel,
  isVoucherInDateRange,
} = require("../utils/couponDiscount");
const { sendCouponAssignedEmail } = require("./mailService");
const { createInboxNotificationsForUsers } = require("./inboxNotificationService");

function parseDateOnly(value) {
  const date = new Date(`${String(value).trim()}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new AppError("Invalid date", 400);
  }
  return date;
}

function serializeVoucher(voucher) {
  const assignedCount = voucher._count?.customerCoupons ?? voucher.assignedCount ?? 0;
  const usedAssignments =
    voucher._count?.usedAssignments ??
    (voucher.customerCoupons
      ? voucher.customerCoupons.filter((item) => item.status === "USED").length
      : 0);

  return {
    id: voucher.id,
    code: voucher.code,
    name: voucher.name,
    description: voucher.description,
    type: voucher.type,
    value: Number(voucher.value),
    maxDiscountAmount:
      voucher.maxDiscountAmount != null ? Number(voucher.maxDiscountAmount) : null,
    minOrderAmount: voucher.minOrderAmount != null ? Number(voucher.minOrderAmount) : null,
    startDate: voucher.startDate,
    endDate: voucher.endDate,
    usageLimit: voucher.usageLimit,
    usagePerCustomer: voucher.usagePerCustomer,
    usedCount: voucher.usedCount,
    isPersonalized: voucher.isPersonalized,
    status: voucher.status,
    assignedCount,
    usedAssignments,
    availableRedemptions: Math.max(0, voucher.usageLimit - voucher.usedCount),
    createdAt: voucher.createdAt,
    updatedAt: voucher.updatedAt,
  };
}

function serializeCustomerCoupon(record) {
  const voucher = record.voucher;
  return {
    id: record.id,
    status: record.status,
    assignedAt: record.assignedAt,
    reservedAt: record.reservedAt,
    usedAt: record.usedAt,
    emailStatus: record.emailStatus,
    emailSentAt: record.emailSentAt,
    programName: voucher.name,
    code: voucher.code,
    description: voucher.description,
    type: voucher.type,
    value: Number(voucher.value),
    maxDiscountAmount:
      voucher.maxDiscountAmount != null ? Number(voucher.maxDiscountAmount) : null,
    minOrderAmount: voucher.minOrderAmount != null ? Number(voucher.minOrderAmount) : null,
    startDate: voucher.startDate,
    endDate: voucher.endDate,
    discountLabel: formatDiscountLabel(voucher),
    voucherStatus: voucher.status,
  };
}

async function findCustomerByUserId(userId) {
  const customer = await prisma.customer.findUnique({ where: { userId } });
  if (!customer) throw new AppError("Customer profile not found", 404);
  return customer;
}

async function resolveCustomerUserIds({ customerUserIds, assignAllCustomers }) {
  if (assignAllCustomers) {
    const users = await prisma.user.findMany({
      where: {
        status: "ACTIVE",
        role: { name: "CUSTOMER" },
      },
      select: { id: true },
    });
    return users.map((item) => item.id);
  }

  const ids = Array.isArray(customerUserIds) ? [...new Set(customerUserIds)] : [];
  if (ids.length === 0) {
    throw new AppError("Select at least one customer to assign the coupon", 400);
  }

  const users = await prisma.user.findMany({
    where: {
      id: { in: ids },
      status: "ACTIVE",
      role: { name: "CUSTOMER" },
    },
    select: { id: true },
  });

  if (users.length !== ids.length) {
    throw new AppError("One or more selected users are not active customers", 400);
  }

  return ids;
}

async function mapUserIdsToCustomerIds(userIds) {
  const customers = await prisma.customer.findMany({
    where: { userId: { in: userIds } },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
  return customers;
}

async function sendAssignmentEmails(customerCoupons) {
  for (const row of customerCoupons) {
    try {
      await sendCouponAssignedEmail({
        to: row.customer.user.email,
        name: row.customer.user.name,
        voucher: row.voucher,
      });
      await prisma.customerCoupon.update({
        where: { id: row.id },
        data: {
          emailStatus: "SENT",
          emailSentAt: new Date(),
          emailError: null,
        },
      });
    } catch (error) {
      await prisma.customerCoupon.update({
        where: { id: row.id },
        data: {
          emailStatus: "FAILED",
          emailError: error.message || "Failed to send email",
        },
      });
    }
  }
}

function validateVoucherPayload(body, { isUpdate = false } = {}) {
  const errors = [];
  if (!isUpdate || body.name !== undefined) {
    if (!body.name || String(body.name).trim().length < 2) errors.push("Program name is required");
  }
  if (!isUpdate || body.code !== undefined) {
    if (!body.code || String(body.code).trim().length < 3) errors.push("Coupon code is required");
  }
  if (!isUpdate || body.type !== undefined) {
    if (!["PERCENTAGE", "FIXED"].includes(body.type)) errors.push("Invalid discount type");
  }
  if (!isUpdate || body.value !== undefined) {
    const value = Number(body.value);
    if (!Number.isFinite(value) || value <= 0) errors.push("Invalid discount value");
    if (body.type === "PERCENTAGE" && value > 100) errors.push("Percentage cannot exceed 100");
  }
  if (!isUpdate || body.usageLimit !== undefined) {
    const limit = Number(body.usageLimit);
    if (!Number.isInteger(limit) || limit < 1) errors.push("Usage limit must be a positive integer");
  }
  if (body.usagePerCustomer !== undefined) {
    const limit = Number(body.usagePerCustomer);
    if (!Number.isInteger(limit) || limit < 1) {
      errors.push("Per-customer usage limit must be a positive integer");
    }
  }
  if (!isUpdate || body.startDate !== undefined) {
    try {
      parseDateOnly(body.startDate);
    } catch {
      errors.push("Invalid start date");
    }
  }
  if (!isUpdate || body.endDate !== undefined) {
    try {
      parseDateOnly(body.endDate);
    } catch {
      errors.push("Invalid end date");
    }
  }
  if (errors.length) throw new AppError(errors.join("; "), 400);

  const start = parseDateOnly(body.startDate);
  const end = parseDateOnly(body.endDate);
  if (end < start) throw new AppError("End date must be on or after start date", 400);
}

async function createCouponAndAssign(body) {
  validateVoucherPayload(body);
  const userIds = await resolveCustomerUserIds(body);
  const customers = await mapUserIdsToCustomerIds(userIds);
  if (customers.length === 0) throw new AppError("No customers found for assignment", 400);

  const code = String(body.code).trim().toUpperCase();
  const existingCode = await prisma.voucher.findUnique({ where: { code } });
  if (existingCode) throw new AppError("Coupon code already exists", 409);

  const voucher = await prisma.$transaction(async (tx) => {
    const created = await tx.voucher.create({
      data: {
        code,
        name: String(body.name).trim(),
        description: body.description?.trim() || null,
        type: body.type,
        value: body.value,
        maxDiscountAmount: body.maxDiscountAmount ?? null,
        minOrderAmount: body.minOrderAmount ?? null,
        startDate: parseDateOnly(body.startDate),
        endDate: parseDateOnly(body.endDate),
        usageLimit: Number(body.usageLimit),
        usagePerCustomer: body.usagePerCustomer != null ? Number(body.usagePerCustomer) : 1,
        status: body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        isPersonalized: true,
      },
    });

    const createRows = customers.map((customer) => ({
      voucherId: created.id,
      customerId: customer.id,
    }));

    if (createRows.length > 0) {
      await tx.customerCoupon.createMany({
        data: createRows,
        skipDuplicates: true,
      });
    }

    return created;
  });

  const assignments = await prisma.customerCoupon.findMany({
    where: { voucherId: voucher.id },
    include: {
      voucher: true,
      customer: { include: { user: { select: { name: true, email: true } } } },
    },
  });

  void sendAssignmentEmails(assignments);

  void createInboxNotificationsForUsers(
    customers.map((customer) => customer.user.id),
    {
      title: "Bạn nhận được mã giảm giá mới",
      message: `Chương trình "${voucher.name}" — mã ${voucher.code}. Vào mục Ưu đãi hoặc đặt lịch để sử dụng.`,
    }
  );

  const created = await prisma.voucher.findUnique({
    where: { id: voucher.id },
    include: { _count: { select: { customerCoupons: true } } },
  });

  if (!created) {
    throw new AppError("Coupon was created but could not be loaded", 500);
  }

  return serializeVoucher(created);
}

async function listCoupons(query) {
  const { page, limit, skip } = parsePagination(query);
  const search = query.search?.trim();
  const where = { isPersonalized: true };

  if (search) {
    where.OR = [
      { code: { contains: search } },
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  if (query.status && query.status !== "ALL") {
    where.status = query.status;
  }

  const [total, rows] = await Promise.all([
    prisma.voucher.count({ where }),
    prisma.voucher.findMany({
      where,
      include: {
        _count: { select: { customerCoupons: true } },
        customerCoupons: { where: { status: "USED" }, select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  const items = rows.map((row) =>
    serializeVoucher({
      ...row,
      _count: {
        customerCoupons: row._count.customerCoupons,
        usedAssignments: row.customerCoupons.length,
      },
    })
  );

  return { items, pagination: buildPagination(page, limit, total) };
}

async function getCouponById(id) {
  const voucher = await prisma.voucher.findUnique({
    where: { id },
    include: {
      _count: { select: { customerCoupons: true } },
      customerCoupons: { where: { status: "USED" }, select: { id: true } },
    },
  });
  if (!voucher || !voucher.isPersonalized) throw new AppError("Coupon not found", 404);
  return serializeVoucher({
    ...voucher,
    _count: {
      customerCoupons: voucher._count.customerCoupons,
      usedAssignments: voucher.customerCoupons.length,
    },
  });
}

async function updateCoupon(id, body) {
  const existing = await prisma.voucher.findUnique({ where: { id } });
  if (!existing || !existing.isPersonalized) throw new AppError("Coupon not found", 404);

  validateVoucherPayload(
    {
      ...existing,
      ...body,
      type: body.type ?? existing.type,
      startDate: body.startDate ?? existing.startDate.toISOString().slice(0, 10),
      endDate: body.endDate ?? existing.endDate.toISOString().slice(0, 10),
    },
    { isUpdate: true }
  );

  const data = {};
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.description !== undefined) data.description = body.description?.trim() || null;
  if (body.type !== undefined) data.type = body.type;
  if (body.value !== undefined) data.value = body.value;
  if (body.maxDiscountAmount !== undefined) data.maxDiscountAmount = body.maxDiscountAmount;
  if (body.minOrderAmount !== undefined) data.minOrderAmount = body.minOrderAmount;
  if (body.startDate !== undefined) data.startDate = parseDateOnly(body.startDate);
  if (body.endDate !== undefined) data.endDate = parseDateOnly(body.endDate);
  if (body.usageLimit !== undefined) data.usageLimit = Number(body.usageLimit);
  if (body.usagePerCustomer !== undefined) data.usagePerCustomer = Number(body.usagePerCustomer);

  await prisma.voucher.update({ where: { id }, data });
  return getCouponById(id);
}

async function patchCouponStatus(id, status) {
  if (!["ACTIVE", "INACTIVE"].includes(status)) {
    throw new AppError("Invalid status", 400);
  }
  const existing = await prisma.voucher.findUnique({ where: { id } });
  if (!existing || !existing.isPersonalized) throw new AppError("Coupon not found", 404);

  await prisma.voucher.update({ where: { id }, data: { status } });
  return getCouponById(id);
}

async function listCouponCustomers(id, query) {
  await getCouponById(id);
  const { page, limit, skip } = parsePagination(query);
  const search = query.search?.trim();
  const where = { voucherId: id };

  if (query.status && query.status !== "ALL") {
    where.status = query.status;
  }

  if (search) {
    where.customer = {
      user: {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ],
      },
    };
  }

  const [total, rows] = await Promise.all([
    prisma.customerCoupon.count({ where }),
    prisma.customerCoupon.findMany({
      where,
      include: {
        voucher: true,
        customer: {
          include: { user: { select: { id: true, name: true, email: true, phone: true } } },
        },
        booking: { select: { id: true, status: true } },
      },
      orderBy: { assignedAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  const items = rows.map((row) => ({
    id: row.id,
    status: row.status,
    assignedAt: row.assignedAt,
    usedAt: row.usedAt,
    emailStatus: row.emailStatus,
    emailSentAt: row.emailSentAt,
    emailError: row.emailError,
    customer: {
      id: row.customer.id,
      userId: row.customer.user.id,
      name: row.customer.user.name,
      email: row.customer.user.email,
      phone: row.customer.user.phone,
    },
    booking: row.booking,
  }));

  return { items, pagination: buildPagination(page, limit, total) };
}

async function retryFailedEmails(id) {
  await getCouponById(id);
  const rows = await prisma.customerCoupon.findMany({
    where: { voucherId: id, emailStatus: "FAILED" },
    include: {
      voucher: true,
      customer: { include: { user: { select: { name: true, email: true } } } },
    },
  });
  if (rows.length === 0) throw new AppError("No failed emails to retry", 400);
  await sendAssignmentEmails(rows);
  return { retried: rows.length };
}

async function searchCustomers(query) {
  const search = query.search?.trim();
  const where = {
    status: "ACTIVE",
    role: { name: "CUSTOMER" },
  };
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    take: 30,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      customer: { select: { id: true } },
    },
  });

  return users
    .filter((user) => user.customer)
    .map((user) => ({
      userId: user.id,
      customerId: user.customer.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    }));
}

async function syncCouponExpiryStatus(record) {
  if (!isVoucherInDateRange(record.voucher)) {
    if (record.status === "AVAILABLE") {
      await prisma.customerCoupon.update({
        where: { id: record.id },
        data: { status: "EXPIRED" },
      });
      return { ...record, status: "EXPIRED" };
    }
  }
  return record;
}

async function listMyCoupons(userId) {
  const customer = await findCustomerByUserId(userId);
  const rows = await prisma.customerCoupon.findMany({
    where: { customerId: customer.id },
    include: { voucher: true },
    orderBy: { assignedAt: "desc" },
  });

  const mapped = [];
  for (const row of rows) {
    const synced = await syncCouponExpiryStatus(row);
    mapped.push(serializeCustomerCoupon(synced));
  }

  const groups = {
    available: mapped.filter((item) => item.status === "AVAILABLE"),
    used: mapped.filter((item) => item.status === "USED"),
    expired: mapped.filter(
      (item) => item.status === "EXPIRED" || item.status === "REVOKED"
    ),
    reserved: mapped.filter((item) => item.status === "RESERVED"),
  };

  return { coupons: mapped, groups };
}

function assertCouponUsable(record, customerId, originalAmount) {
  if (record.customerId !== customerId) {
    throw new AppError("Coupon does not belong to this customer", 403);
  }
  if (record.status !== "AVAILABLE") {
    throw new AppError("Coupon is not available", 400);
  }
  if (record.voucher.status !== "ACTIVE") {
    throw new AppError("Coupon program is inactive", 400);
  }
  if (!isVoucherInDateRange(record.voucher)) {
    throw new AppError("Coupon is outside the valid date range", 400);
  }
  if (record.voucher.usedCount >= record.voucher.usageLimit) {
    throw new AppError("Coupon redemption limit has been reached", 400);
  }
  if (
    record.voucher.minOrderAmount != null &&
    Number(originalAmount) < Number(record.voucher.minOrderAmount)
  ) {
    throw new AppError("Order does not meet the minimum amount for this coupon", 400);
  }
}

async function getAvailableCouponsForBooking(userId, serviceId) {
  const customer = await findCustomerByUserId(userId);
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { id: true, price: true, status: true },
  });
  if (!service || service.status !== "ACTIVE") {
    throw new AppError("Service not found", 404);
  }

  const rows = await prisma.customerCoupon.findMany({
    where: {
      customerId: customer.id,
      status: "AVAILABLE",
      voucher: { status: "ACTIVE", isPersonalized: true },
    },
    include: { voucher: true },
    orderBy: { assignedAt: "desc" },
  });

  const now = new Date();
  const eligible = [];
  for (const row of rows) {
    const synced = await syncCouponExpiryStatus(row);
    if (synced.status !== "AVAILABLE") continue;
    if (!isVoucherInDateRange(synced.voucher, now)) continue;
    if (synced.voucher.usedCount >= synced.voucher.usageLimit) continue;
    if (
      synced.voucher.minOrderAmount != null &&
      Number(service.price) < Number(synced.voucher.minOrderAmount)
    ) {
      continue;
    }
    const pricing = computeDiscountAmount(synced.voucher, service.price);
    eligible.push({
      ...serializeCustomerCoupon(synced),
      pricing,
    });
  }

  return eligible;
}

async function applyCoupon(userId, { customerCouponId, serviceId }) {
  const customer = await findCustomerByUserId(userId);
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { id: true, price: true, status: true },
  });
  if (!service || service.status !== "ACTIVE") {
    throw new AppError("Service not found", 404);
  }

  const record = await prisma.customerCoupon.findUnique({
    where: { id: customerCouponId },
    include: { voucher: true },
  });
  if (!record) throw new AppError("Coupon not found", 404);

  const synced = await syncCouponExpiryStatus(record);
  assertCouponUsable(synced, customer.id, service.price);

  const pricing = computeDiscountAmount(synced.voucher, service.price);
  return {
    customerCouponId: synced.id,
    couponCode: synced.voucher.code,
    programName: synced.voucher.name,
    discountLabel: formatDiscountLabel(synced.voucher),
    ...pricing,
  };
}

async function reserveCouponForBooking(tx, customerId, customerCouponId, servicePrice) {
  const record = await tx.customerCoupon.findUnique({
    where: { id: customerCouponId },
    include: { voucher: true },
  });
  if (!record) throw new AppError("Coupon not found", 404);

  assertCouponUsable(record, customerId, servicePrice);

  const updated = await tx.customerCoupon.updateMany({
    where: { id: customerCouponId, customerId, status: "AVAILABLE" },
    data: { status: "RESERVED", reservedAt: new Date() },
  });
  if (updated.count !== 1) {
    throw new AppError("Coupon is no longer available", 409);
  }

  const pricing = computeDiscountAmount(record.voucher, servicePrice);
  return {
    voucherId: record.voucherId,
    pricing,
  };
}

module.exports = {
  createCouponAndAssign,
  listCoupons,
  getCouponById,
  updateCoupon,
  patchCouponStatus,
  listCouponCustomers,
  retryFailedEmails,
  searchCustomers,
  listMyCoupons,
  getAvailableCouponsForBooking,
  applyCoupon,
  reserveCouponForBooking,
  findCustomerByUserId,
};