const prisma = require("../config/prisma");
const AppError = require("../utils/appError");
const { parsePagination, buildPagination, parseSort } = require("../utils/query");

const SERVICE_CODE_PATTERN = /^[A-Za-z0-9_-]{2,50}$/;

function normalizeServiceCode(code) {
  if (code === undefined || code === null || String(code).trim() === "") {
    throw new AppError("Service code is required", 400);
  }
  const trimmed = String(code).trim();
  if (!SERVICE_CODE_PATTERN.test(trimmed)) {
    throw new AppError(
      "Service code must be 2-50 characters (letters, numbers, underscore, hyphen)",
      400
    );
  }
  return trimmed.toUpperCase();
}

async function assertServiceCodeAvailable(codeUpper, excludeId) {
  const conflict = await prisma.service.findFirst({
    where: {
      code: codeUpper,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  if (conflict) {
    throw new AppError("Service code already exists", 409);
  }
}

function serializeService(service) {
  return {
    id: service.id,
    categoryId: service.categoryId,
    code: service.code,
    name: service.name,
    description: service.description,
    price: Number(service.price),
    duration: service.duration,
    image: service.image,
    status: service.status,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
    category: service.category
      ? {
          id: service.category.id,
          name: service.category.name,
          status: service.category.status,
        }
      : undefined,
  };
}

const serviceInclude = {
  category: {
    select: { id: true, name: true, status: true },
  },
};

function statusFilter(role, statusQuery) {
  if (role === "ADMIN") {
    if (!statusQuery || statusQuery === "ALL") return undefined;
    if (statusQuery === "ACTIVE" || statusQuery === "INACTIVE") return statusQuery;
    throw new AppError("Invalid status", 400);
  }
  return "ACTIVE";
}

async function ensureCategory(categoryId) {
  const category = await prisma.serviceCategory.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new AppError("Invalid categoryId", 400);
  }

  return category;
}

async function listServices(query, role) {
  const { page, limit, skip } = parsePagination(query);
  const orderBy = parseSort(query);
  const where = {};

  const statusValue = statusFilter(role, query.status);
  if (statusValue) {
    where.status = statusValue;
    where.category = { status: "ACTIVE" };
  }

  if (query.categoryId) {
    if (!/^[0-9a-f-]{36}$/i.test(query.categoryId)) {
      throw new AppError("Invalid categoryId", 400);
    }
    where.categoryId = query.categoryId;
  }

  const search = query.search?.trim();
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { code: { contains: search.toUpperCase() } },
    ];
  }

  const minPrice = query.minPrice !== undefined && query.minPrice !== "" ? Number(query.minPrice) : null;
  const maxPrice = query.maxPrice !== undefined && query.maxPrice !== "" ? Number(query.maxPrice) : null;

  if (minPrice !== null && !Number.isFinite(minPrice)) {
    throw new AppError("Invalid minPrice", 400);
  }
  if (maxPrice !== null && !Number.isFinite(maxPrice)) {
    throw new AppError("Invalid maxPrice", 400);
  }

  if (minPrice !== null || maxPrice !== null) {
    where.price = {};
    if (minPrice !== null) where.price.gte = minPrice;
    if (maxPrice !== null) where.price.lte = maxPrice;
  }

  const [total, rows] = await Promise.all([
    prisma.service.count({ where }),
    prisma.service.findMany({
      where,
      include: serviceInclude,
      orderBy,
      skip,
      take: limit,
    }),
  ]);

  return {
    items: rows.map(serializeService),
    pagination: buildPagination(page, limit, total),
  };
}

async function getServiceById(id, role) {
  const service = await prisma.service.findUnique({
    where: { id },
    include: serviceInclude,
  });

  if (!service) {
    throw new AppError("Service not found", 404);
  }

  if (role !== "ADMIN" && (service.status !== "ACTIVE" || service.category.status !== "ACTIVE")) {
    throw new AppError("Service not found", 404);
  }

  return serializeService(service);
}

async function createService(payload) {
  await ensureCategory(payload.categoryId);
  const code = normalizeServiceCode(payload.code);
  await assertServiceCodeAvailable(code);

  let service;
  try {
    service = await prisma.service.create({
      data: {
        categoryId: payload.categoryId,
        code,
        name: payload.name.trim(),
        description: payload.description?.trim() || null,
        price: payload.price,
        duration: Number(payload.duration),
        image: payload.image?.trim() || null,
        status: payload.status || "ACTIVE",
      },
      include: serviceInclude,
    });
  } catch (err) {
    if (err?.code === "P2002") {
      throw new AppError("Service code already exists", 409);
    }
    throw err;
  }

  return serializeService(service);
}

async function updateService(id, payload) {
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Service not found", 404);
  }

  if (payload.categoryId) {
    await ensureCategory(payload.categoryId);
  }

  const data = {};
  if (payload.name !== undefined) data.name = payload.name.trim();
  if (payload.description !== undefined) {
    data.description = payload.description === "" ? null : payload.description.trim();
  }
  if (payload.price !== undefined) data.price = payload.price;
  if (payload.duration !== undefined) data.duration = Number(payload.duration);
  if (payload.categoryId !== undefined) data.categoryId = payload.categoryId;
  if (payload.image !== undefined) data.image = payload.image === "" ? null : payload.image.trim();
  if (payload.status !== undefined) data.status = payload.status;
  if (payload.code !== undefined) {
    const code = normalizeServiceCode(payload.code);
    await assertServiceCodeAvailable(code, id);
    data.code = code;
  }

  const service = await prisma.service.update({
    where: { id },
    data,
    include: serviceInclude,
  });

  return serializeService(service);
}

async function changeServiceStatus(id, status) {
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Service not found", 404);
  }

  const service = await prisma.service.update({
    where: { id },
    data: { status },
    include: serviceInclude,
  });

  return serializeService(service);
}

async function deleteService(id) {
  const service = await prisma.service.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          bookings: true,
          staffServices: true,
          reviews: true,
          treatmentRecords: true,
        },
      },
    },
  });

  if (!service) {
    throw new AppError("Service not found", 404);
  }

  const related =
    service._count.bookings +
    service._count.staffServices +
    service._count.reviews +
    service._count.treatmentRecords;

  if (related > 0) {
    throw new AppError(
      "Service is in use and cannot be deleted. Set status to INACTIVE instead.",
      409
    );
  }

  await prisma.service.delete({ where: { id } });
}

module.exports = {
  listServices,
  getServiceById,
  createService,
  updateService,
  changeServiceStatus,
  deleteService,
};
