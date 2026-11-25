const prisma = require("../config/prisma");
const AppError = require("../utils/appError");
const { hashPassword } = require("../utils/password");
const { parsePagination, buildPagination } = require("../utils/query");

const staffInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      status: true,
      role: { select: { name: true } },
    },
  },
  staffServices: {
    include: {
      service: {
        select: {
          id: true,
          name: true,
          status: true,
          duration: true,
          price: true,
          image: true,
          categoryId: true,
        },
      },
    },
  },
};

function serializeService(service) {
  if (!service) return null;
  return {
    id: service.id,
    name: service.name,
    status: service.status,
    duration: service.duration,
    price: service.price !== undefined ? Number(service.price) : undefined,
    image: service.image,
    categoryId: service.categoryId,
  };
}

function serializeStaff(staff) {
  return {
    id: staff.id,
    userId: staff.userId,
    name: staff.user.name,
    email: staff.user.email,
    phone: staff.user.phone,
    avatar: staff.user.avatar,
    specialization: staff.specialization,
    status: staff.status,
    accountStatus: staff.user.status,
    role: staff.user.role?.name || "STAFF",
    services: (staff.staffServices || [])
      .map((item) => serializeService(item.service))
      .filter(Boolean),
    createdAt: staff.createdAt,
    updatedAt: staff.updatedAt,
  };
}

const ACCOUNT_STATUSES = new Set(["ACTIVE", "INACTIVE", "LOCKED", "BANNED"]);
const ACCOUNT_ROLES = new Set(["STAFF", "ADMIN"]);

function statusFilter(statusQuery) {
  if (!statusQuery || statusQuery === "ALL") return undefined;
  if (statusQuery === "ACTIVE" || statusQuery === "INACTIVE") return statusQuery;
  throw new AppError("Invalid status", 400);
}

function accountStatusFilter(statusQuery) {
  if (!statusQuery || statusQuery === "ALL") return undefined;
  if (ACCOUNT_STATUSES.has(statusQuery)) return statusQuery;
  throw new AppError("Invalid accountStatus", 400);
}

function assertNotSelf(staff, actorUserId, action) {
  if (actorUserId && staff.userId === actorUserId) {
    throw new AppError(`You cannot ${action} your own account`, 400);
  }
}

async function findStaffOrThrow(id) {
  const staff = await prisma.staff.findUnique({
    where: { id },
    include: staffInclude,
  });

  if (!staff) {
    throw new AppError("Staff not found", 404);
  }

  return staff;
}

async function findStaffByUserIdOrThrow(userId) {
  const staff = await prisma.staff.findUnique({
    where: { userId },
    include: staffInclude,
  });

  if (!staff) {
    throw new AppError("Staff profile not found", 404);
  }

  return staff;
}

async function assertUniqueContact({ email, phone, excludeUserId }) {
  if (email) {
    const existingEmail = await prisma.user.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
      },
    });
    if (existingEmail) {
      throw new AppError("Email already exists", 409);
    }
  }

  if (phone) {
    const existingPhone = await prisma.user.findFirst({
      where: {
        phone: String(phone).trim(),
        ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
      },
    });
    if (existingPhone) {
      throw new AppError("Phone already exists", 409);
    }
  }
}

function buildUserData(payload) {
  const data = {};
  if (payload.name !== undefined) data.name = payload.name.trim();
  if (payload.email !== undefined) data.email = payload.email.trim().toLowerCase();
  if (payload.phone !== undefined) data.phone = String(payload.phone).trim();
  if (payload.avatar !== undefined) {
    data.avatar = payload.avatar === "" || payload.avatar == null ? null : payload.avatar.trim();
  }
  return data;
}

async function listStaff(query) {
  const { page, limit, skip } = parsePagination(query);
  const where = {};

  const statusValue = statusFilter(query.status);
  if (statusValue) {
    where.status = statusValue;
  }

  const accountStatusValue = accountStatusFilter(query.accountStatus);
  if (accountStatusValue) {
    where.user = { ...(where.user || {}), status: accountStatusValue };
  }

  const search = query.search?.trim();
  if (search) {
    where.OR = [
      { specialization: { contains: search } },
      {
        user: {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
          ],
        },
      },
    ];
  }

  const order = query.order === "asc" ? "asc" : "desc";
  const sortBy = query.sortBy;
  let orderBy = { createdAt: order };
  if (sortBy === "name") {
    orderBy = { user: { name: order } };
  } else if (sortBy === "specialization") {
    orderBy = { specialization: order };
  }

  const [total, rows] = await Promise.all([
    prisma.staff.count({ where }),
    prisma.staff.findMany({
      where,
      include: staffInclude,
      orderBy,
      skip,
      take: limit,
    }),
  ]);

  return {
    items: rows.map(serializeStaff),
    pagination: buildPagination(page, limit, total),
  };
}

async function getStaffById(id) {
  return serializeStaff(await findStaffOrThrow(id));
}

async function createStaff(payload) {
  const email = payload.email.trim().toLowerCase();
  const phone = String(payload.phone).trim();

  await assertUniqueContact({ email, phone });

  const staffRole = await prisma.role.findUnique({ where: { name: "STAFF" } });
  if (!staffRole) {
    throw new AppError("Staff role is not configured", 500);
  }

  const hashed = await hashPassword(payload.password);
  const status = payload.status || "ACTIVE";

  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        roleId: staffRole.id,
        name: payload.name.trim(),
        email,
        phone,
        password: hashed,
        avatar: payload.avatar?.trim() || null,
        status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      },
    });

    return tx.staff.create({
      data: {
        userId: user.id,
        specialization: payload.specialization?.trim() || null,
        status,
      },
      include: staffInclude,
    });
  });

  return serializeStaff(created);
}

async function updateStaff(id, payload, { actorUserId } = {}) {
  const existing = await findStaffOrThrow(id);

  if (payload.role !== undefined && payload.role !== existing.user.role?.name) {
    assertNotSelf(existing, actorUserId, "change the role of");
  }

  await assertUniqueContact({
    email: payload.email,
    phone: payload.phone,
    excludeUserId: existing.userId,
  });

  const userData = buildUserData(payload);
  if (payload.password) {
    userData.password = await hashPassword(payload.password);
  }
  if (payload.status !== undefined) {
    userData.status =
      payload.status === "INACTIVE"
        ? "INACTIVE"
        : existing.user.status === "LOCKED"
          ? "LOCKED"
          : "ACTIVE";
  }
  if (payload.role !== undefined) {
    if (!ACCOUNT_ROLES.has(payload.role)) {
      throw new AppError("Role must be STAFF or ADMIN", 400);
    }
    const nextRole = await prisma.role.findUnique({ where: { name: payload.role } });
    if (!nextRole) {
      throw new AppError("Role is not configured", 500);
    }
    userData.roleId = nextRole.id;
  }

  const staffData = {};
  if (payload.specialization !== undefined) {
    staffData.specialization =
      payload.specialization === "" || payload.specialization == null
        ? null
        : payload.specialization.trim();
  }
  if (payload.status !== undefined) {
    staffData.status = payload.status;
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (Object.keys(userData).length > 0) {
      await tx.user.update({
        where: { id: existing.userId },
        data: userData,
      });
    }

    if (Object.keys(staffData).length > 0) {
      return tx.staff.update({
        where: { id },
        data: staffData,
        include: staffInclude,
      });
    }

    return tx.staff.findUnique({
      where: { id },
      include: staffInclude,
    });
  });

  return serializeStaff(updated);
}

async function changeStaffStatus(id, { status, locked }, { actorUserId } = {}) {
  const existing = await findStaffOrThrow(id);
  assertNotSelf(existing, actorUserId, "change the status of");
  const staffData = {};
  const userData = {};
  const nextStaffStatus = status !== undefined ? status : existing.status;

  if (status !== undefined) {
    staffData.status = status;
  }

  if (locked === true) {
    userData.status = "LOCKED";
  } else if (locked === false) {
    userData.status = nextStaffStatus === "INACTIVE" ? "INACTIVE" : "ACTIVE";
  } else if (status === "INACTIVE") {
    userData.status = "INACTIVE";
  } else if (status === "ACTIVE" && existing.user.status !== "LOCKED") {
    userData.status = "ACTIVE";
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (Object.keys(userData).length > 0) {
      await tx.user.update({
        where: { id: existing.userId },
        data: userData,
      });
    }

    if (Object.keys(staffData).length > 0) {
      return tx.staff.update({
        where: { id },
        data: staffData,
        include: staffInclude,
      });
    }

    return tx.staff.findUnique({
      where: { id },
      include: staffInclude,
    });
  });

  return serializeStaff(updated);
}

async function deleteStaff(id, { actorUserId } = {}) {
  const staff = await prisma.staff.findUnique({
    where: { id },
  });

  if (!staff) {
    throw new AppError("Staff not found", 404);
  }

  assertNotSelf(staff, actorUserId, "delete");

  await prisma.$transaction(async (tx) => {
    await tx.review.deleteMany({ where: { staffId: id } });
    await tx.treatmentRecord.deleteMany({ where: { staffId: id } });
    await tx.booking.deleteMany({ where: { staffId: id } });
    await tx.staffService.deleteMany({ where: { staffId: id } });
    await tx.staffSchedule.deleteMany({ where: { staffId: id } });
    await tx.staff.delete({ where: { id } });
    await tx.user.delete({ where: { id: staff.userId } });
  });
}

async function getStaffServices(id) {
  const staff = await findStaffOrThrow(id);
  return serializeStaff(staff).services;
}

async function assignStaffServices(id, serviceIds) {
  await findStaffOrThrow(id);

  const uniqueIds = [...new Set((serviceIds || []).map((value) => String(value)))];

  if (uniqueIds.length > 0) {
    const services = await prisma.service.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });

    if (services.length !== uniqueIds.length) {
      throw new AppError("One or more services do not exist", 400);
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.staffService.deleteMany({ where: { staffId: id } });
    if (uniqueIds.length > 0) {
      await tx.staffService.createMany({
        data: uniqueIds.map((serviceId) => ({ staffId: id, serviceId })),
      });
    }
  });

  return getStaffServices(id);
}

async function getMyProfile(userId) {
  return serializeStaff(await findStaffByUserIdOrThrow(userId));
}

async function updateMyProfile(userId, payload) {
  const existing = await findStaffByUserIdOrThrow(userId);

  await assertUniqueContact({
    email: payload.email,
    phone: payload.phone,
    excludeUserId: userId,
  });

  const userData = buildUserData(payload);
  const staffData = {};
  if (payload.specialization !== undefined) {
    staffData.specialization =
      payload.specialization === "" || payload.specialization == null
        ? null
        : payload.specialization.trim();
  }

  await prisma.$transaction(async (tx) => {
    if (Object.keys(userData).length > 0) {
      await tx.user.update({
        where: { id: userId },
        data: userData,
      });
    }

    if (Object.keys(staffData).length > 0) {
      await tx.staff.update({
        where: { id: existing.id },
        data: staffData,
      });
    }
  });

  return getMyProfile(userId);
}

module.exports = {
  listStaff,
  getStaffById,
  createStaff,
  updateStaff,
  changeStaffStatus,
  deleteStaff,
  getStaffServices,
  assignStaffServices,
  getMyProfile,
  updateMyProfile,
};
