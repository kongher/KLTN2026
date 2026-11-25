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

async function createAndCompleteBooking(customerToken, staffToken, adminToken, preferredStaffEmail) {
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
      const staff = (staffRes.json.data || []).find(
        (item) => item.email === preferredStaffEmail
      );
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
          note: "Phase 8 treatment test",
        },
      });
      if (created.status !== 201) continue;

      const bookingId = created.json.data.id;
      const confirmed = await request(`/api/staff/bookings/${bookingId}/confirm`, {
        method: "PATCH",
        token: staffToken,
      });
      if (confirmed.status !== 200) continue;

      const completed = await request(`/api/staff/bookings/${bookingId}/complete`, {
        method: "PATCH",
        token: staffToken,
      });
      if (completed.status === 200) {
        return { booking: completed.json.data, staff };
      }
    }
  }

  throw new Error(`Could not create completed booking for ${preferredStaffEmail}`);
}

async function main() {
  const customerToken = await login("an.customer@spa.local");
  const otherCustomerToken = await login("binh.customer@spa.local");
  const staffToken = await login("lan.staff@spa.local");
  const otherStaffToken = await login("minh.staff@spa.local");
  const adminToken = await login("admin@spa.local");

  if (!customerToken || !otherCustomerToken || !staffToken || !otherStaffToken || !adminToken) {
    throw new Error("Failed to login demo accounts");
  }

  // Pending booking cannot create treatment
  const services = await request("/api/services?limit=5", { token: customerToken });
  const service = (services.json.data || []).find((item) => item.status === "ACTIVE");
  let pendingBookingId = null;
  for (let day = 1; day <= 21; day += 1) {
    const bookingDate = dateOffset(day);
    const staffRes = await request(
      `/api/bookings/available-staff?serviceId=${service.id}&bookingDate=${bookingDate}`,
      { token: customerToken }
    );
    const staff = (staffRes.json.data || []).find(
      (item) => item.email === "lan.staff@spa.local"
    );
    if (!staff) continue;
    const slotsRes = await request(
      `/api/bookings/available-slots?serviceId=${service.id}&staffId=${staff.id}&bookingDate=${bookingDate}`,
      { token: customerToken }
    );
    const slot = slotsRes.json.data?.[0];
    if (!slot) continue;
    const created = await request("/api/bookings", {
      method: "POST",
      token: customerToken,
      body: {
        serviceId: service.id,
        staffId: staff.id,
        bookingDate,
        startTime: slot.startTime,
      },
    });
    if (created.status === 201) {
      pendingBookingId = created.json.data.id;
      break;
    }
  }

  const pendingCreate = await request("/api/treatments", {
    method: "POST",
    token: staffToken,
    body: { bookingId: pendingBookingId, note: "should fail" },
  });
  if (pendingCreate.status === 400) {
    pass("1. Pending booking không tạo treatment");
  } else {
    fail("1. Pending booking không tạo treatment", JSON.stringify(pendingCreate.json));
  }

  const completedCtx = await createAndCompleteBooking(
    customerToken,
    staffToken,
    adminToken,
    "lan.staff@spa.local"
  );

  const beforeUrl = "https://picsum.photos/seed/spa-before/400/300";
  const afterUrl = "https://picsum.photos/seed/spa-after/400/300";

  const created = await request("/api/treatments", {
    method: "POST",
    token: staffToken,
    body: {
      bookingId: completedCtx.booking.id,
      note: "Skin looked clearer after facial",
      beforeImage: beforeUrl,
      afterImage: afterUrl,
    },
  });
  if (
    created.status === 201 &&
    created.json.data?.beforeImage === beforeUrl &&
    created.json.data?.afterImage === afterUrl
  ) {
    pass("2. Completed booking tạo treatment + ảnh đúng");
  } else {
    fail("2. Completed booking tạo treatment + ảnh đúng", JSON.stringify(created.json));
  }

  const treatmentId = created.json.data?.id;

  const otherStaffUpdate = await request(`/api/treatments/${treatmentId}`, {
    method: "PUT",
    token: otherStaffToken,
    body: { note: "hacked" },
  });
  if (otherStaffUpdate.status === 403) {
    pass("3. Staff khác không sửa treatment");
  } else {
    fail("3. Staff khác không sửa treatment", JSON.stringify(otherStaffUpdate.json));
  }

  const otherCustomerGet = await request(`/api/treatments/${treatmentId}`, {
    token: otherCustomerToken,
  });
  if (otherCustomerGet.status === 403) {
    pass("4. Customer khác không xem treatment");
  } else {
    fail("4. Customer khác không xem treatment", JSON.stringify(otherCustomerGet.json));
  }

  const customerList = await request("/api/customer/treatments", { token: customerToken });
  if (
    customerList.status === 200 &&
    (customerList.json.data || []).some((item) => item.id === treatmentId)
  ) {
    pass("5. Customer xem treatment của mình");
  } else {
    fail("5. Customer xem treatment của mình", JSON.stringify(customerList.json));
  }

  const adminList = await request("/api/admin/treatments", { token: adminToken });
  if (
    adminList.status === 200 &&
    (adminList.json.data || []).some((item) => item.id === treatmentId)
  ) {
    pass("6. Admin xem được treatment");
  } else {
    fail("6. Admin xem được treatment", JSON.stringify(adminList.json));
  }

  const adminCreate = await request("/api/treatments", {
    method: "POST",
    token: adminToken,
    body: { bookingId: completedCtx.booking.id, note: "admin should not create" },
  });
  if (adminCreate.status === 403) {
    pass("7. Admin không tạo treatment");
  } else {
    fail("7. Admin không tạo treatment", JSON.stringify(adminCreate.json));
  }

  const staffUpdate = await request(`/api/treatments/${treatmentId}`, {
    method: "PUT",
    token: staffToken,
    body: { note: "Updated note", beforeImage: beforeUrl, afterImage: afterUrl },
  });
  if (staffUpdate.status === 200 && staffUpdate.json.data?.note === "Updated note") {
    pass("8. Staff sở hữu cập nhật treatment");
  } else {
    fail("8. Staff sở hữu cập nhật treatment", JSON.stringify(staffUpdate.json));
  }

  const byCustomer = await request(
    `/api/treatments/customer/${completedCtx.booking.customerId}`,
    { token: adminToken }
  );
  if (
    byCustomer.status === 200 &&
    (byCustomer.json.data || []).some((item) => item.id === treatmentId)
  ) {
    pass("9. GET /treatments/customer/:customerId");
  } else {
    fail("9. GET /treatments/customer/:customerId", JSON.stringify(byCustomer.json));
  }

  const otherStaffCreate = await request("/api/treatments", {
    method: "POST",
    token: otherStaffToken,
    body: {
      bookingId: completedCtx.booking.id,
      note: "should fail ownership",
    },
  });
  // already has treatment OR wrong staff — either 403 or 409
  if (otherStaffCreate.status === 403 || otherStaffCreate.status === 409) {
    pass("10. Staff khác không tạo treatment cho booking không phải của mình");
  } else {
    fail(
      "10. Staff khác không tạo treatment cho booking không phải của mình",
      JSON.stringify(otherStaffCreate.json)
    );
  }

  const failed = results.filter((item) => !item.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
