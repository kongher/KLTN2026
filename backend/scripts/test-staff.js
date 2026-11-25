require("dotenv").config();
const prisma = require("../src/config/prisma");

const BASE = `http://127.0.0.1:${process.env.PORT || 5000}`;
const results = [];
const suffix = Date.now().toString().slice(-6);

function pass(name) {
  results.push({ name, ok: true });
  console.log(`PASS  ${name}`);
}

function fail(name, detail) {
  results.push({ name, ok: false, detail });
  console.log(`FAIL  ${name} — ${detail}`);
}

async function request(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function login(email, password = "Demo@123456") {
  const res = await request("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
  return res.json.data?.token;
}

async function main() {
  const adminToken = await login("admin@spa.local");
  const customerToken = await login("an.customer@spa.local");
  const staffToken = await login("lan.staff@spa.local");

  if (!adminToken || !customerToken || !staffToken) {
    throw new Error("Failed to login demo accounts");
  }

  const list = await request("/api/staff", { token: adminToken });
  if (
    list.status === 200 &&
    Array.isArray(list.json.data) &&
    list.json.data.length >= 3 &&
    list.json.pagination &&
    list.json.data.every((item) => item.password === undefined)
  ) {
    pass("1. Admin xem Staff");
  } else {
    fail("1. Admin xem Staff", JSON.stringify(list.json));
  }

  const existingStaffId = list.json.data[0]?.id;
  const email = `phase4.staff.${suffix}@spa.local`;
  const phone = `098${suffix}1`;
  const password = "Staffpass123";

  const created = await request("/api/staff", {
    method: "POST",
    token: adminToken,
    body: {
      name: "Nhân viên Phase 4",
      email,
      phone,
      password,
      specialization: "Chăm sóc da mặt",
      avatar: "https://i.pravatar.cc/150?img=21",
      status: "ACTIVE",
    },
  });
  if (
    created.status === 201 &&
    created.json.data?.email === email &&
    created.json.data?.role === "STAFF" &&
    created.json.data?.password === undefined
  ) {
    pass("2. Admin tạo Staff");
  } else {
    fail("2. Admin tạo Staff", JSON.stringify(created.json));
  }

  const staffId = created.json.data?.id;
  const userId = created.json.data?.userId;

  const updated = await request(`/api/staff/${staffId}`, {
    method: "PUT",
    token: adminToken,
    body: {
      name: "Nhân viên Phase 4 Updated",
      specialization: "Massage trị liệu",
    },
  });
  if (
    updated.status === 200 &&
    updated.json.data?.name === "Nhân viên Phase 4 Updated" &&
    updated.json.data?.specialization === "Massage trị liệu"
  ) {
    pass("3. Admin sửa Staff");
  } else {
    fail("3. Admin sửa Staff", JSON.stringify(updated.json));
  }

  const deactivated = await request(`/api/staff/${staffId}/status`, {
    method: "PATCH",
    token: adminToken,
    body: { status: "INACTIVE" },
  });
  if (deactivated.status === 200 && deactivated.json.data?.status === "INACTIVE") {
    pass("4. Admin deactivate Staff");
  } else {
    fail("4. Admin deactivate Staff", JSON.stringify(deactivated.json));
  }

  const activated = await request(`/api/staff/${staffId}/status`, {
    method: "PATCH",
    token: adminToken,
    body: { status: "ACTIVE" },
  });
  if (activated.status === 200 && activated.json.data?.status === "ACTIVE") {
    pass("5. Admin activate Staff");
  } else {
    fail("5. Admin activate Staff", JSON.stringify(activated.json));
  }

  const services = await request("/api/services?limit=5", { token: adminToken });
  const serviceIds = (services.json.data || []).slice(0, 2).map((item) => item.id);

  const assigned = await request(`/api/staff/${staffId}/services`, {
    method: "PUT",
    token: adminToken,
    body: { serviceIds },
  });
  if (
    assigned.status === 200 &&
    Array.isArray(assigned.json.data) &&
    assigned.json.data.length === serviceIds.length &&
    serviceIds.every((id) => assigned.json.data.some((item) => item.id === id))
  ) {
    pass("6. Admin assign Service");
  } else {
    fail("6. Admin assign Service", JSON.stringify(assigned.json));
  }

  const removed = await request(`/api/staff/${staffId}/services`, {
    method: "PUT",
    token: adminToken,
    body: { serviceIds: serviceIds.slice(0, 1) },
  });
  const remaining = await request(`/api/staff/${staffId}/services`, { token: adminToken });
  if (
    removed.status === 200 &&
    remaining.json.data?.length === 1 &&
    remaining.json.data[0].id === serviceIds[0]
  ) {
    pass("7. Admin remove Service assignment");
  } else {
    fail(
      "7. Admin remove Service assignment",
      JSON.stringify({ removed: removed.json, remaining: remaining.json })
    );
  }

  const newStaffToken = await login(email, password);
  const profile = await request("/api/staff/profile", { token: newStaffToken });
  if (
    profile.status === 200 &&
    profile.json.data?.email === email &&
    profile.json.data?.password === undefined
  ) {
    pass("8. Staff xem profile");
  } else {
    fail("8. Staff xem profile", JSON.stringify(profile.json));
  }

  const profileUpdated = await request("/api/staff/profile", {
    method: "PUT",
    token: newStaffToken,
    body: {
      name: "Staff Self Updated",
      specialization: "Chăm sóc body",
    },
  });
  if (
    profileUpdated.status === 200 &&
    profileUpdated.json.data?.name === "Staff Self Updated" &&
    profileUpdated.json.data?.specialization === "Chăm sóc body"
  ) {
    pass("9. Staff sửa profile");
  } else {
    fail("9. Staff sửa profile", JSON.stringify(profileUpdated.json));
  }

  const staffEditOther = await request(`/api/staff/${existingStaffId}`, {
    method: "PUT",
    token: newStaffToken,
    body: { name: "Hack Other Staff" },
  });
  if (staffEditOther.status === 403) {
    pass("10. Staff không sửa Staff khác");
  } else {
    fail("10. Staff không sửa Staff khác", JSON.stringify(staffEditOther.json));
  }

  const staffDeleteOther = await request(`/api/staff/${existingStaffId}`, {
    method: "DELETE",
    token: newStaffToken,
  });
  if (staffDeleteOther.status === 403) {
    pass("11. Staff không xóa Staff");
  } else {
    fail("11. Staff không xóa Staff", JSON.stringify(staffDeleteOther.json));
  }

  const customerList = await request("/api/staff", { token: customerToken });
  const customerCreate = await request("/api/staff", {
    method: "POST",
    token: customerToken,
    body: {
      name: "Hack Staff",
      email: `hack.${suffix}@spa.local`,
      phone: `097${suffix}1`,
      password: "Hackpass123",
    },
  });
  if (customerList.status === 403 && customerCreate.status === 403) {
    pass("12. Customer không truy cập Staff Management");
  } else {
    fail(
      "12. Customer không truy cập Staff Management",
      JSON.stringify({ customerList: customerList.json, customerCreate: customerCreate.json })
    );
  }

  const dupEmail = await request("/api/staff", {
    method: "POST",
    token: adminToken,
    body: {
      name: "Duplicate Email",
      email,
      phone: `097${suffix}2`,
      password: "Staffpass123",
    },
  });
  if (dupEmail.status === 409) {
    pass("13. Duplicate email bị từ chối");
  } else {
    fail("13. Duplicate email bị từ chối", JSON.stringify(dupEmail.json));
  }

  const dupPhone = await request("/api/staff", {
    method: "POST",
    token: adminToken,
    body: {
      name: "Duplicate Phone",
      email: `phase4.other.${suffix}@spa.local`,
      phone,
      password: "Staffpass123",
    },
  });
  if (dupPhone.status === 409) {
    pass("14. Duplicate phone bị từ chối");
  } else {
    fail("14. Duplicate phone bị từ chối", JSON.stringify(dupPhone.json));
  }

  const storedUser = await prisma.user.findUnique({ where: { id: userId } });
  if (storedUser?.password && storedUser.password.startsWith("$2") && storedUser.password !== password) {
    pass("15. Password được hash");
  } else {
    fail("15. Password được hash", storedUser?.password ? "hash missing or plaintext" : "user not found");
  }

  const duplicateAssign = await request(`/api/staff/${staffId}/services`, {
    method: "PUT",
    token: adminToken,
    body: { serviceIds: [serviceIds[0], serviceIds[0], serviceIds[0]] },
  });
  const dbCount = await prisma.staffService.count({
    where: { staffId, serviceId: serviceIds[0] },
  });
  if (duplicateAssign.status === 200 && duplicateAssign.json.data?.length === 1 && dbCount === 1) {
    pass("16. Database không tạo duplicate StaffService");
  } else {
    fail(
      "16. Database không tạo duplicate StaffService",
      JSON.stringify({ duplicateAssign: duplicateAssign.json, dbCount })
    );
  }

  if (staffId) {
    await request(`/api/staff/${staffId}`, { method: "DELETE", token: adminToken });
  }

  const failed = results.filter((item) => !item.ok);
  console.log("\n----------------------------------------");
  console.log(`${results.filter((item) => item.ok).length}/${results.length} tests passed`);
  if (failed.length) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
