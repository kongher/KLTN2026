const prisma = require("../config/prisma");
const AppError = require("../utils/appError");
const { parsePagination, buildPagination } = require("../utils/query");

const customerInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      status: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  _count: {
    select: { bookings: true },
  },
};

const ACCOUNT_STATUSES = new Set(["ACTIVE", "INACTIVE", "LOCKED", "BANNED"]);

function accountStatusFilter(statusQuery) {
  if (!statusQuery || statusQuery === "ALL") return undefined;
  if (ACCOUNT_STATUSES.has(statusQuery)) return statusQuery;
  throw new AppError("Invalid accountStatus", 400);
}

function serializeCustomer(customer) {
  return {
    id: customer.id,
    userId: customer.userId,
    name: customer.user.name,
    email: customer.user.email,
    phone: customer.user.phone,
    avatar: customer.user.avatar,
    accountStatus: customer.user.status,
    emailVerified: customer.user.emailVerified,
    dateOfBirth: customer.dateOfBirth
      ? customer.dateOfBirth.toISOString().slice(0, 10)
      : null,
    gender: customer.gender,
    address: customer.address,
    bookingCount: customer._count?.bookings ?? 0,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}

async function findCustomerOrThrow(id) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: customerInclude,
  });

  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  return customer;
}

async function listCustomers(query) {
  const { page, limit, skip } = parsePagination(query);
  const accountStatusValue = accountStatusFilter(query.accountStatus);

  const search = query.search?.trim();
  const where = {
    user: {
      role: { name: "CUSTOMER" },
      ...(accountStatusValue ? { status: accountStatusValue } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    },
  };

  const order = query.order === "asc" ? "asc" : "desc";
  const sortBy = query.sortBy;
  let orderBy = { createdAt: order };
  if (sortBy === "name") {
    orderBy = { user: { name: order } };
  }

  const [total, rows] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      include: customerInclude,
      orderBy,
      skip,
      take: limit,
    }),
  ]);

  return {
    items: rows.map(serializeCustomer),
    pagination: buildPagination(page, limit, total),
  };
}

async function getCustomerById(id) {
  return serializeCustomer(await findCustomerOrThrow(id));
}

module.exports = {
  listCustomers,
  getCustomerById,
};