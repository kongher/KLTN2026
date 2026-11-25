require("dotenv").config();
const prisma = require("../src/config/prisma");

const BASE = `http://127.0.0.1:${process.env.PORT || 5000}`;
const results = [];

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

function futureDate(daysAhead) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

async function main() {
  const adminToken = await login("admin@spa.local");
  const staffToken = await login("lan.staff@spa.local");
  const customerToken = await login("an.customer@spa.local");

  if (!adminToken || !staffToken || !customerToken) {
    throw new Error("Failed to login demo accounts");
  }

  const staffList = await request("/api/staff?limit=5", { token: adminToken });
  const staff = staffList.json.data?.find((item) => item.email === "lan.staff@spa.local");
  if (!staff?.id) {
    throw new Error("Demo staff lan.staff@spa.local not found");
  }

  const date = futureDate(21);

  const created = await request("/api/schedules", {
    method: "POST",
    token: adminToken,
    body: {
      staffId: staff.id,
      date,
      startTime: "09:00",
      endTime: "12:00",
      status: "AVAILABLE",
    },
  });
  if (
    created.status === 201 &&
    created.json.data?.staffId === staff.id &&
    created.json.data?.date === date &&
    created.json.data?.startTime === "09:00:00"
  ) {
    pass("1. Admin create schedule");
  } else {
    fail("1. Admin create schedule", JSON.stringify(created.json));
  }

  const scheduleId = created.json.data?.id;

  const edited = await request(`/api/schedules/${scheduleId}`, {
    method: "PUT",
    token: adminToken,
    body: {
      endTime: "13:00",
      status: "AVAILABLE",
    },
  });
  if (edited.status === 200 && edited.json.data?.endTime === "13:00:00") {
    pass("2. Admin edit schedule");
  } else {
    fail("2. Admin edit schedule", JSON.stringify(edited.json));
  }

  const staffView = await request("/api/schedules?from=" + date + "&to=" + date, {
    token: staffToken,
  });
  const staffByStaffRoute = await request(`/api/staff/${staff.id}/schedules?date=${date}`, {
    token: staffToken,
  });
  if (
    staffView.status === 200 &&
    staffView.json.data?.some((item) => item.id === scheduleId) &&
    staffByStaffRoute.status === 200 &&
    staffByStaffRoute.json.data?.some((item) => item.id === scheduleId)
  ) {
    pass("3. Staff xem schedule");
  } else {
    fail(
      "3. Staff xem schedule",
      JSON.stringify({ staffView: staffView.json, staffByStaffRoute: staffByStaffRoute.json })
    );
  }

  const staffEdit = await request(`/api/schedules/${scheduleId}`, {
    method: "PUT",
    token: staffToken,
    body: { endTime: "14:00" },
  });
  const staffCreate = await request("/api/schedules", {
    method: "POST",
    token: staffToken,
    body: {
      staffId: staff.id,
      date,
      startTime: "14:00",
      endTime: "17:00",
    },
  });
  if (staffEdit.status === 403 && staffCreate.status === 403) {
    pass("4. Staff không sửa schedule");
  } else {
    fail(
      "4. Staff không sửa schedule",
      JSON.stringify({ staffEdit: staffEdit.json, staffCreate: staffCreate.json })
    );
  }

  const invalidTime = await request("/api/schedules", {
    method: "POST",
    token: adminToken,
    body: {
      staffId: staff.id,
      date,
      startTime: "17:00",
      endTime: "09:00",
    },
  });
  if (invalidTime.status === 400) {
    pass("5. Invalid time");
  } else {
    fail("5. Invalid time", JSON.stringify(invalidTime.json));
  }

  const duplicate = await request("/api/schedules", {
    method: "POST",
    token: adminToken,
    body: {
      staffId: staff.id,
      date,
      startTime: "09:00",
      endTime: "11:00",
    },
  });
  const overlap = await request("/api/schedules", {
    method: "POST",
    token: adminToken,
    body: {
      staffId: staff.id,
      date,
      startTime: "10:00",
      endTime: "12:00",
    },
  });
  if (duplicate.status === 409 && overlap.status === 409) {
    pass("6. Duplicate / overlap schedule");
  } else {
    fail(
      "6. Duplicate / overlap schedule",
      JSON.stringify({ duplicate: duplicate.json, overlap: overlap.json })
    );
  }

  const inactive = await request(`/api/schedules/${scheduleId}/status`, {
    method: "PATCH",
    token: adminToken,
    body: { status: "UNAVAILABLE" },
  });
  const active = await request(`/api/schedules/${scheduleId}/status`, {
    method: "PATCH",
    token: adminToken,
    body: { status: "AVAILABLE" },
  });
  if (
    inactive.status === 200 &&
    inactive.json.data?.status === "UNAVAILABLE" &&
    active.status === 200 &&
    active.json.data?.status === "AVAILABLE"
  ) {
    pass("7. Inactive / Active schedule");
  } else {
    fail(
      "7. Inactive / Active schedule",
      JSON.stringify({ inactive: inactive.json, active: active.json })
    );
  }

  const customerAccess = await request("/api/schedules", { token: customerToken });
  if (customerAccess.status === 403) {
    pass("8. Customer không truy cập schedule");
  } else {
    fail("8. Customer không truy cập schedule", JSON.stringify(customerAccess.json));
  }

  const deleted = await request(`/api/schedules/${scheduleId}`, {
    method: "DELETE",
    token: adminToken,
  });
  const missing = await request(`/api/schedules/${scheduleId}`, { token: adminToken });
  if (deleted.status === 200 && missing.status === 404) {
    pass("9. Admin delete schedule");
  } else {
    fail(
      "9. Admin delete schedule",
      JSON.stringify({ deleted: deleted.json, missing: missing.json })
    );
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
