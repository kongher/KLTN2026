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

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function findBookableContext(customerToken) {
  const services = await request("/api/services?limit=20", { token: customerToken });
  const service = (services.json.data || []).find((item) => item.status === "ACTIVE");
  if (!service) throw new Error("No active service");

  for (let day = 1; day <= 14; day += 1) {
    const bookingDate = dateOffset(day);
    const staffRes = await request(
      `/api/bookings/available-staff?serviceId=${service.id}&bookingDate=${bookingDate}`,
      { token: customerToken }
    );
    const staff = staffRes.json.data?.[0];
    if (!staff) continue;

    const slotsRes = await request(
      `/api/bookings/available-slots?serviceId=${service.id}&staffId=${staff.id}&bookingDate=${bookingDate}`,
      { token: customerToken }
    );
    const slots = slotsRes.json.data || [];
    if (slots.length >= 2) {
      return { service, staff, bookingDate, slots };
    }
  }

  throw new Error("No bookable staff/date/slots found in next 14 days");
}

async function main() {
  const customerToken = await login("an.customer@spa.local");
  const otherCustomerToken = await login("binh.customer@spa.local");
  const adminToken = await login("admin@spa.local");
  const staffToken = await login("lan.staff@spa.local");

  if (!customerToken || !otherCustomerToken || !adminToken || !staffToken) {
    throw new Error("Failed to login demo accounts");
  }

  const ctx = await findBookableContext(customerToken);

  const staffList = await request(
    `/api/bookings/available-staff?serviceId=${ctx.service.id}&bookingDate=${ctx.bookingDate}`,
    { token: customerToken }
  );
  if (staffList.status === 200 && staffList.json.data?.some((item) => item.id === ctx.staff.id)) {
    pass("1. Customer chọn service + available staff");
  } else {
    fail("1. Customer chọn service + available staff", JSON.stringify(staffList.json));
  }

  const slots = await request(
    `/api/bookings/available-slots?serviceId=${ctx.service.id}&staffId=${ctx.staff.id}&bookingDate=${ctx.bookingDate}`,
    { token: customerToken }
  );
  if (slots.status === 200 && Array.isArray(slots.json.data) && slots.json.data.length > 0) {
    pass("2. Customer lấy available slots");
  } else {
    fail("2. Customer lấy available slots", JSON.stringify(slots.json));
  }

  const slot = ctx.slots[0];
  const created = await request("/api/bookings", {
    method: "POST",
    token: customerToken,
    body: {
      serviceId: ctx.service.id,
      staffId: ctx.staff.id,
      bookingDate: ctx.bookingDate,
      startTime: slot.startTime,
      note: "Phase 6 test booking",
    },
  });
  if (
    created.status === 201 &&
    created.json.data?.status === "PENDING" &&
    created.json.data?.endTime === slot.endTime &&
    created.json.data?.totalPrice === ctx.service.price
  ) {
    pass("3. Customer tạo booking");
  } else {
    fail("3. Customer tạo booking", JSON.stringify(created.json));
  }

  const bookingId = created.json.data?.id;

  const listed = await request("/api/bookings", { token: customerToken });
  const detail = await request(`/api/bookings/${bookingId}`, { token: customerToken });
  if (
    listed.status === 200 &&
    listed.json.data?.some((item) => item.id === bookingId) &&
    detail.status === 200 &&
    detail.json.data?.id === bookingId
  ) {
    pass("4. Customer xem booking");
  } else {
    fail(
      "4. Customer xem booking",
      JSON.stringify({ listed: listed.json, detail: detail.json })
    );
  }

  const otherView = await request(`/api/bookings/${bookingId}`, {
    token: otherCustomerToken,
  });
  if (otherView.status === 403) {
    pass("5. Customer A không xem Booking Customer B");
  } else {
    fail("5. Customer A không xem Booking Customer B", JSON.stringify(otherView.json));
  }

  const otherCancel = await request(`/api/bookings/${bookingId}/cancel`, {
    method: "PATCH",
    token: otherCustomerToken,
  });
  if (otherCancel.status === 403) {
    pass("6. Customer A không hủy Booking Customer B");
  } else {
    fail("6. Customer A không hủy Booking Customer B", JSON.stringify(otherCancel.json));
  }

  const overlapSlot = ctx.slots[0];
  const overlap = await request("/api/bookings", {
    method: "POST",
    token: otherCustomerToken,
    body: {
      serviceId: ctx.service.id,
      staffId: ctx.staff.id,
      bookingDate: ctx.bookingDate,
      startTime: overlapSlot.startTime,
    },
  });
  if (overlap.status === 409) {
    pass("7. Booking overlap bị từ chối");
  } else {
    fail("7. Booking overlap bị từ chối", JSON.stringify(overlap.json));
  }

  const allStaff = await request("/api/staff?limit=20", { token: adminToken });
  const wrongStaff = (allStaff.json.data || []).find(
    (item) =>
      item.id !== ctx.staff.id &&
      !item.services?.some((service) => service.id === ctx.service.id)
  );
  if (wrongStaff) {
    const cannotService = await request("/api/bookings", {
      method: "POST",
      token: customerToken,
      body: {
        serviceId: ctx.service.id,
        staffId: wrongStaff.id,
        bookingDate: ctx.bookingDate,
        startTime: "09:00",
      },
    });
    if (cannotService.status === 400) {
      pass("8. Staff không làm Service");
    } else {
      fail("8. Staff không làm Service", JSON.stringify(cannotService.json));
    }
  } else {
    fail("8. Staff không làm Service", "Could not find unmatched staff");
  }

  const noScheduleDate = dateOffset(40);
  const noDay = await request("/api/bookings", {
    method: "POST",
    token: customerToken,
    body: {
      serviceId: ctx.service.id,
      staffId: ctx.staff.id,
      bookingDate: noScheduleDate,
      startTime: "09:00",
    },
  });
  if (noDay.status === 400) {
    pass("9. Staff không làm ngày đó");
  } else {
    fail("9. Staff không làm ngày đó", JSON.stringify(noDay.json));
  }

  const outsideHours = await request("/api/bookings", {
    method: "POST",
    token: customerToken,
    body: {
      serviceId: ctx.service.id,
      staffId: ctx.staff.id,
      bookingDate: ctx.bookingDate,
      startTime: "06:00",
    },
  });
  if (outsideHours.status === 400) {
    pass("10. Time ngoài schedule");
  } else {
    fail("10. Time ngoài schedule", JSON.stringify(outsideHours.json));
  }

  const past = await request("/api/bookings", {
    method: "POST",
    token: customerToken,
    body: {
      serviceId: ctx.service.id,
      staffId: ctx.staff.id,
      bookingDate: dateOffset(-2),
      startTime: "09:00",
    },
  });
  if (past.status === 400) {
    pass("11. Time quá khứ");
  } else {
    fail("11. Time quá khứ", JSON.stringify(past.json));
  }

  await prisma.service.update({
    where: { id: ctx.service.id },
    data: { status: "INACTIVE" },
  });
  const inactiveService = await request("/api/bookings", {
    method: "POST",
    token: customerToken,
    body: {
      serviceId: ctx.service.id,
      staffId: ctx.staff.id,
      bookingDate: ctx.bookingDate,
      startTime: ctx.slots[1].startTime,
    },
  });
  await prisma.service.update({
    where: { id: ctx.service.id },
    data: { status: "ACTIVE" },
  });
  if (inactiveService.status === 400) {
    pass("12. Service inactive");
  } else {
    fail("12. Service inactive", JSON.stringify(inactiveService.json));
  }

  await prisma.staff.update({
    where: { id: ctx.staff.id },
    data: { status: "INACTIVE" },
  });
  const inactiveStaff = await request("/api/bookings", {
    method: "POST",
    token: customerToken,
    body: {
      serviceId: ctx.service.id,
      staffId: ctx.staff.id,
      bookingDate: ctx.bookingDate,
      startTime: ctx.slots[1].startTime,
    },
  });
  await prisma.staff.update({
    where: { id: ctx.staff.id },
    data: { status: "ACTIVE" },
  });
  if (inactiveStaff.status === 400) {
    pass("13. Staff inactive");
  } else {
    fail("13. Staff inactive", JSON.stringify(inactiveStaff.json));
  }

  const staffCreate = await request("/api/bookings", {
    method: "POST",
    token: staffToken,
    body: {
      serviceId: ctx.service.id,
      staffId: ctx.staff.id,
      bookingDate: ctx.bookingDate,
      startTime: ctx.slots[1].startTime,
    },
  });
  if (staffCreate.status === 403) {
    pass("14. Staff không tạo booking customer API");
  } else {
    fail("14. Staff không tạo booking customer API", JSON.stringify(staffCreate.json));
  }

  const cancelled = await request(`/api/bookings/${bookingId}/cancel`, {
    method: "PATCH",
    token: customerToken,
  });
  if (cancelled.status === 200 && cancelled.json.data?.status === "CANCELLED") {
    pass("15. Customer hủy booking");
  } else {
    fail("15. Customer hủy booking", JSON.stringify(cancelled.json));
  }

  const cancelAgain = await request(`/api/bookings/${bookingId}/cancel`, {
    method: "PATCH",
    token: customerToken,
  });
  if (cancelAgain.status === 400) {
    pass("16. Không hủy booking không PENDING");
  } else {
    fail("16. Không hủy booking không PENDING", JSON.stringify(cancelAgain.json));
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
