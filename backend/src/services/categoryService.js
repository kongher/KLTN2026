const prisma = require("../config/prisma");
const AppError = require("../utils/appError");

function serializeCategory(category) {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    status: category.status,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    _count: category._count,
  };
}

function statusFilter(role, statusQuery) {
  if (role === "ADMIN") {
    if (!statusQuery || statusQuery === "ALL") return undefined;
    if (statusQuery === "ACTIVE" || statusQuery === "INACTIVE") return statusQuery;
    throw new AppError("Invalid status", 400);
  }
  return "ACTIVE";
}

async function listCategories({ role, status }) {
  const where = {};
  const statusValue = statusFilter(role, status);
  if (statusValue) where.status = statusValue;

  const categories = await prisma.serviceCategory.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      _count: { select: { services: true } },
    },
  });

  return categories.map(serializeCategory);
}

async function getCategoryById(id, role) {
  const category = await prisma.serviceCategory.findUnique({
    where: { id },
    include: {
      _count: { select: { services: true } },
    },
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  if (role !== "ADMIN" && category.status !== "ACTIVE") {
    throw new AppError("Category not found", 404);
  }

  return serializeCategory(category);
}

async function createCategory({ name, description, status }) {
  const existing = await prisma.serviceCategory.findUnique({
    where: { name: name.trim() },
  });

  if (existing) {
    throw new AppError("Category name already exists", 409);
  }

  const category = await prisma.serviceCategory.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      status: status || "ACTIVE",
    },
    include: {
      _count: { select: { services: true } },
    },
  });

  return serializeCategory(category);
}

async function updateCategory(id, payload) {
  const category = await prisma.serviceCategory.findUnique({ where: { id } });
  if (!category) {
    throw new AppError("Category not found", 404);
  }

  if (payload.name && payload.name.trim() !== category.name) {
    const existing = await prisma.serviceCategory.findUnique({
      where: { name: payload.name.trim() },
    });
    if (existing) {
      throw new AppError("Category name already exists", 409);
    }
  }

  const data = {};
  if (payload.name !== undefined) data.name = payload.name.trim();
  if (payload.description !== undefined) {
    data.description = payload.description === "" ? null : payload.description.trim();
  }
  if (payload.status !== undefined) data.status = payload.status;

  const updated = await prisma.serviceCategory.update({
    where: { id },
    data,
    include: {
      _count: { select: { services: true } },
    },
  });

  return serializeCategory(updated);
}

async function deleteCategory(id) {
  const category = await prisma.serviceCategory.findUnique({
    where: { id },
    include: { _count: { select: { services: true } } },
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  if (category._count.services > 0) {
    throw new AppError(
      "Category is in use and cannot be deleted. Set status to INACTIVE instead.",
      409
    );
  }

  await prisma.serviceCategory.delete({ where: { id } });
}

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
