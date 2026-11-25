require("dotenv").config();

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

async function createBookingForStaff(customerToken, preferredStaffEmail) {
  const services = await request("/api/services?limit=20", { token: customerToken });
  const serviceList = (services.json.data || []).filter((item) => item.status === "ACTIVE");
  if (!serviceList.length) throw new Error("No active service");

  for (const service of serviceList) {
    for (let day = 1; day <= 21; day += 1) {
      const bookingDate = dateOffset(day);
      const staffRes = await request(
        `/api/bookings/available-staff?serviceId=${service.id}&bookingDate=${bookingDate}`,
        { token: customerToken }
      );
      const staff = (staffRes.json.data || []).find((item) => item.email === preferredStaffEmail);
      if (!staff) continue;

      const slotsRes = await request(
        `/api/bookings/available-slots?serviceId=${service.id}&staffId=${staff.id}&bookingDate=${bookingDate}`,
        { token: customerToken }
      );
      const slots = slotsRes.json.data || [];
      if (!slots.length) continue;

      const created = await request("/api/bookings", {
        method: "POST",
        token: customerToken,
        body: {
          serviceId: service.id,
          staffId: staff.id,
          bookingDate,
          startTime: slots[0].startTime,
          note: "Phase 7 staff booking test",
        },
      });

      if (created.status === 201) {
        return { booking: created.json.data, staff, service, bookingDate };
      }
    }
  }

  throw new Error(`Could not create a test booking for ${preferredStaffEmail}`);
}

async function main() {
  const customerToken = await login("an.customer@spa.local");
  const staffToken = await login("lan.staff@spa.local");
  const otherStaffToken = await login("minh.staff@spa.local");
  const adminToken = await login("admin@spa.local");

  if (!customerToken || !staffToken || !otherStaffToken || !adminToken) {
    throw new Error("Failed to login demo accounts");
  }

  const pendingCtx = await createBookingForStaff(customerToken, "lan.staff@spa.local");
  const pendingId = pendingCtx.booking.id;

  const listPending = await request("/api/staff/bookings?limit=50", { token: staffToken });
  if (
    listPending.status === 200 &&
    (listPending.json.data || []).some((item) => item.id === pendingId)
  ) {
    pass("1. Staff thấy lịch PENDING được gán cho mình");
  } else {
    fail("1. Staff thấy lịch PENDING được gán cho mình", JSON.stringify(listPending.json));
  }

  const pendingGet = await request(`/api/staff/bookings/${pendingId}`, { token: staffToken });
  if (pendingGet.status === 200 && pendingGet.json.data?.status === "PENDING") {
    pass("2. Staff xem chi tiết lịch chờ xác nhận");
  } else {
    fail("2. Staff xem chi tiết lịch chờ xác nhận", JSON.stringify(pendingGet.json));
  }

  const otherList = await request("/api/staff/bookings", { token: otherStaffToken });
  if (
    otherList.status === 200 &&
    !(otherList.json.data || []).some((item) => item.id === pendingId)
  ) {
    pass("3. Staff không thấy booking của Staff khác trong list");
  } else {
    fail("3. Staff không thấy booking của Staff khác trong list", JSON.stringify(otherList.json));
  }

  const adminCannotConfirm = await request(`/api/admin/bookings/${pendingId}/confirm`, {
    method: "PATCH",
    token: adminToken,
  });
  if (adminCannotConfirm.status === 404) {
    pass("4. Admin không còn API duyệt lịch");
  } else {
    fail("4. Admin không còn API duyệt lịch", JSON.stringify(adminCannotConfirm.json));
  }

  const adminList = await request("/api/admin/bookings?status=PENDING&limit=50", {
    token: adminToken,
  });
  if (
    adminList.status === 200 &&
    (adminList.json.data || []).some((item) => item.id === pendingId)
  ) {
    pass("5. Admin thấy lịch chờ nhân viên xác nhận (chỉ xem)");
  } else {
    fail("5. Admin thấy lịch chờ nhân viên xác nhận (chỉ xem)", JSON.stringify(adminList.json));
  }

  const confirm = await request(`/api/staff/bookings/${pendingId}/confirm`, {
    method: "PATCH",
    token: staffToken,
  });
  if (confirm.status === 200 && confirm.json.data?.status === "CONFIRMED") {
    pass("6. Staff xác nhận PENDING → CONFIRMED");
  } else {
    fail("6. Staff xác nhận PENDING → CONFIRMED", JSON.stringify(confirm.json));
  }

  const listMine = await request("/api/staff/bookings?limit=50", { token: staffToken });
  if (
    listMine.status === 200 &&
    (listMine.json.data || []).some((item) => item.id === pendingId && item.status === "CONFIRMED")
  ) {
    pass("7. Staff thấy lịch đã xác nhận trong danh sách");
  } else {
    fail("7. Staff thấy lịch đã xác nhận trong danh sách", JSON.stringify(listMine.json));
  }

  const otherGet = await request(`/api/staff/bookings/${pendingId}`, {
    token: otherStaffToken,
  });
  if (otherGet.status === 403) {
    pass("8. Staff khác không xem chi tiết booking");
  } else {
    fail("8. Staff khác không xem chi tiết booking", JSON.stringify(otherGet.json));
  }

  const customerSees = await request(`/api/bookings/${pendingId}`, {
    token: customerToken,
  });
  if (customerSees.status === 200 && customerSees.json.data?.status === "CONFIRMED") {
    pass("9. Customer refresh thấy status mới");
  } else {
    fail("9. Customer refresh thấy status mới", JSON.stringify(customerSees.json));
  }

  const complete = await request(`/api/staff/bookings/${pendingId}/complete`, {
    method: "PATCH",
    token: staffToken,
  });
  if (complete.status === 200 && complete.json.data?.status === "COMPLETED") {
    pass("10. Staff complete CONFIRMED → COMPLETED");
  } else {
    fail("10. Staff complete CONFIRMED → COMPLETED", JSON.stringify(complete.json));
  }

  const rejectCtx = await createBookingForStaff(customerToken, "lan.staff@spa.local");
  const staffReject = await request(`/api/staff/bookings/${rejectCtx.booking.id}/reject`, {
    method: "PATCH",
    token: staffToken,
  });
  if (staffReject.status === 200 && staffReject.json.data?.status === "REJECTED") {
    pass("11. Staff từ chối PENDING → REJECTED");
  } else {
    fail("11. Staff từ chối PENDING → REJECTED", JSON.stringify(staffReject.json));
  }

  const adminReject = await request(`/api/admin/bookings/${rejectCtx.booking.id}/reject`, {
    method: "PATCH",
    token: adminToken,
  });
  if (adminReject.status === 404) {
    pass("12. Admin không từ chối được lịch");
  } else {
    fail("12. Admin không từ chối được lịch", JSON.stringify(adminReject.json));
  }

  const cancelCtx = await createBookingForStaff(customerToken, "lan.staff@spa.local");
  await request(`/api/staff/bookings/${cancelCtx.booking.id}/confirm`, {
    method: "PATCH",
    token: staffToken,
  });
  const staffCancel = await request(`/api/staff/bookings/${cancelCtx.booking.id}/cancel`, {
    method: "PATCH",
    token: staffToken,
  });
  if (staffCancel.status === 200 && staffCancel.json.data?.status === "CANCELLED") {
    pass("13. Staff hủy CONFIRMED → CANCELLED");
  } else {
    fail("13. Staff hủy CONFIRMED → CANCELLED", JSON.stringify(staffCancel.json));
  }

  const adminCancel = await request(`/api/admin/bookings/${cancelCtx.booking.id}/cancel`, {
    method: "PATCH",
    token: adminToken,
  });
  if (adminCancel.status === 404) {
    pass("14. Admin không hủy lịch");
  } else {
    fail("14. Admin không hủy lịch", JSON.stringify(adminCancel.json));
  }

  const pendingCountStaff = await request("/api/staff/bookings/pending-count", {
    token: staffToken,
  });
  if (pendingCountStaff.status === 200 && typeof pendingCountStaff.json.data?.count === "number") {
    pass("15. Staff lấy được số lịch chờ xác nhận");
  } else {
    fail("15. Staff lấy được số lịch chờ xác nhận", JSON.stringify(pendingCountStaff.json));
  }

  const pendingCountAdmin = await request("/api/admin/bookings/pending-count", {
    token: adminToken,
  });
  if (pendingCountAdmin.status === 200 && typeof pendingCountAdmin.json.data?.count === "number") {
    pass("16. Admin lấy được số lịch chờ xác nhận");
  } else {
    fail("16. Admin lấy được số lịch chờ xác nhận", JSON.stringify(pendingCountAdmin.json));
  }

  const unauth = await request("/api/staff/bookings");
  if (unauth.status === 401) {
    pass("17. Unauthorized access không token");
  } else {
    fail("17. Unauthorized access không token", JSON.stringify(unauth.json));
  }

  const adminForbidden = await request("/api/staff/bookings", { token: adminToken });
  if (adminForbidden.status === 403) {
    pass("18. Admin không dùng staff booking API");
  } else {
    fail("18. Admin không dùng staff booking API", JSON.stringify(adminForbidden.json));
  }

  const staffForbiddenAdmin = await request("/api/admin/bookings", { token: staffToken });
  if (staffForbiddenAdmin.status === 403) {
    pass("19. Staff không dùng admin booking API");
  } else {
    fail("19. Staff không dùng admin booking API", JSON.stringify(staffForbiddenAdmin.json));
  }

  const failed = results.filter((item) => !item.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
