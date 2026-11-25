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

async function login(email) {
  const res = await request("/api/auth/login", {
    method: "POST",
    body: { email, password: "Demo@123456" },
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

  const categories = await request("/api/categories");
  if (categories.status === 200 && Array.isArray(categories.json.data) && categories.json.data.length >= 3) {
    pass("1. GET categories");
  } else {
    fail("1. GET categories", JSON.stringify(categories.json));
  }

  const services = await request("/api/services?page=1&limit=10");
  if (
    services.status === 200 &&
    Array.isArray(services.json.data) &&
    services.json.data.length > 0 &&
    services.json.pagination
  ) {
    pass("2. GET services");
  } else {
    fail("2. GET services", JSON.stringify(services.json));
  }

  const firstService = services.json.data[0];
  const detail = await request(`/api/services/${firstService.id}`);
  if (detail.status === 200 && detail.json.data?.id === firstService.id && detail.json.data.price !== undefined) {
    pass("3. GET service detail");
  } else {
    fail("3. GET service detail", JSON.stringify(detail.json));
  }

  const search = await request("/api/services?search=massage");
  if (
    search.status === 200 &&
    search.json.data.length > 0 &&
    search.json.data.every((item) => /massage/i.test(`${item.name} ${item.description || ""}`))
  ) {
    pass("4. Search service");
  } else {
    fail("4. Search service", JSON.stringify(search.json));
  }

  const categoryId = firstService.categoryId;
  const filtered = await request(`/api/services?categoryId=${categoryId}`);
  if (filtered.status === 200 && filtered.json.data.every((item) => item.categoryId === categoryId)) {
    pass("5. Filter category");
  } else {
    fail("5. Filter category", JSON.stringify(filtered.json));
  }

  const priceFiltered = await request("/api/services?minPrice=100000&maxPrice=500000");
  if (
    priceFiltered.status === 200 &&
    priceFiltered.json.data.every((item) => item.price >= 100000 && item.price <= 500000)
  ) {
    pass("6. Filter price");
  } else {
    fail("6. Filter price", JSON.stringify(priceFiltered.json));
  }

  const page1 = await request("/api/services?page=1&limit=2");
  if (
    page1.status === 200 &&
    page1.json.pagination?.page === 1 &&
    page1.json.pagination?.limit === 2 &&
    page1.json.pagination?.total >= page1.json.data.length &&
    page1.json.data.length <= 2
  ) {
    pass("7. Pagination");
  } else {
    fail("7. Pagination", JSON.stringify(page1.json));
  }

  const stamp = Date.now().toString().slice(-6);
  const createdCategory = await request("/api/categories", {
    method: "POST",
    token: adminToken,
    body: {
      name: `Test Category ${stamp}`,
      description: "Temporary category for Phase 3 tests",
      status: "ACTIVE",
    },
  });
  if (createdCategory.status === 201 && createdCategory.json.data?.id) {
    pass("8. Admin create category");
  } else {
    fail("8. Admin create category", JSON.stringify(createdCategory.json));
  }

  const categoryTestId = createdCategory.json.data?.id;
  const updatedCategory = await request(`/api/categories/${categoryTestId}`, {
    method: "PUT",
    token: adminToken,
    body: { description: "Updated description" },
  });
  if (updatedCategory.status === 200 && updatedCategory.json.data?.description === "Updated description") {
    pass("9. Admin update category");
  } else {
    fail("9. Admin update category", JSON.stringify(updatedCategory.json));
  }

  const deactivatedCategory = await request(`/api/categories/${categoryTestId}`, {
    method: "PUT",
    token: adminToken,
    body: { status: "INACTIVE" },
  });
  const deletedEmptyCategory = await request(`/api/categories/${categoryTestId}`, {
    method: "DELETE",
    token: adminToken,
  });
  if (deactivatedCategory.status === 200 && deletedEmptyCategory.status === 200) {
    pass("10. Admin delete/deactivate category");
  } else {
    fail(
      "10. Admin delete/deactivate category",
      JSON.stringify({ deactivatedCategory: deactivatedCategory.json, deletedEmptyCategory: deletedEmptyCategory.json })
    );
  }

  const reusableCategory = await request("/api/categories", {
    method: "POST",
    token: adminToken,
    body: { name: `Spa Test ${stamp}`, description: "Reusable", status: "ACTIVE" },
  });
  const newCategoryId = reusableCategory.json.data?.id;

  const createdService = await request("/api/services", {
    method: "POST",
    token: adminToken,
    body: {
      name: `Test Service ${stamp}`,
      description: "Temporary service",
      price: 199000,
      duration: 45,
      categoryId: newCategoryId,
      image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874",
      status: "ACTIVE",
    },
  });
  if (createdService.status === 201 && createdService.json.data?.name.includes("Test Service")) {
    pass("11. Admin create service");
  } else {
    fail("11. Admin create service", JSON.stringify(createdService.json));
  }

  const serviceTestId = createdService.json.data?.id;
  const updatedService = await request(`/api/services/${serviceTestId}`, {
    method: "PUT",
    token: adminToken,
    body: { price: 259000, duration: 50 },
  });
  if (updatedService.status === 200 && updatedService.json.data?.price === 259000) {
    pass("12. Admin update service");
  } else {
    fail("12. Admin update service", JSON.stringify(updatedService.json));
  }

  const deactivated = await request(`/api/services/${serviceTestId}/status`, {
    method: "PATCH",
    token: adminToken,
    body: { status: "INACTIVE" },
  });
  const activated = await request(`/api/services/${serviceTestId}/status`, {
    method: "PATCH",
    token: adminToken,
    body: { status: "ACTIVE" },
  });
  if (deactivated.json.data?.status === "INACTIVE" && activated.json.data?.status === "ACTIVE") {
    pass("13. Admin change service status");
  } else {
    fail("13. Admin change service status", JSON.stringify({ deactivated: deactivated.json, activated: activated.json }));
  }

  const blockedDelete = await request(`/api/services/${firstService.id}`, {
    method: "DELETE",
    token: adminToken,
  });
  const hardDelete = await request(`/api/services/${serviceTestId}`, {
    method: "DELETE",
    token: adminToken,
  });
  if (blockedDelete.status === 409 && hardDelete.status === 200) {
    pass("14. Admin delete/deactivate service");
  } else {
    fail(
      "14. Admin delete/deactivate service",
      JSON.stringify({ blockedDelete: blockedDelete.json, hardDelete: hardDelete.json })
    );
  }

  await request(`/api/categories/${newCategoryId}`, { method: "DELETE", token: adminToken });

  const customerCreate = await request("/api/services", {
    method: "POST",
    token: customerToken,
    body: {
      name: "Hack Service",
      price: 100000,
      duration: 30,
      categoryId,
    },
  });
  if (customerCreate.status === 403) {
    pass("15. Customer không được POST service");
  } else {
    fail("15. Customer không được POST service", JSON.stringify(customerCreate.json));
  }

  const staffCreate = await request("/api/services", {
    method: "POST",
    token: staffToken,
    body: {
      name: "Hack Service",
      price: 100000,
      duration: 30,
      categoryId,
    },
  });
  if (staffCreate.status === 403) {
    pass("16. Staff không được POST service");
  } else {
    fail("16. Staff không được POST service", JSON.stringify(staffCreate.json));
  }

  const invalidCategory = await request("/api/services", {
    method: "POST",
    token: adminToken,
    body: {
      name: "Invalid category service",
      price: 100000,
      duration: 30,
      categoryId: "not-a-valid-category-id",
    },
  });
  if (invalidCategory.status === 400) {
    pass("17. Invalid categoryId");
  } else {
    fail("17. Invalid categoryId", JSON.stringify(invalidCategory.json));
  }

  const invalidPrice = await request("/api/services", {
    method: "POST",
    token: adminToken,
    body: {
      name: "Invalid price",
      price: -10,
      duration: 30,
      categoryId,
    },
  });
  if (invalidPrice.status === 400) {
    pass("18. Invalid price");
  } else {
    fail("18. Invalid price", JSON.stringify(invalidPrice.json));
  }

  const invalidDuration = await request("/api/services", {
    method: "POST",
    token: adminToken,
    body: {
      name: "Invalid duration",
      price: 100000,
      duration: 0,
      categoryId,
    },
  });
  if (invalidDuration.status === 400) {
    pass("19. Invalid duration");
  } else {
    fail("19. Invalid duration", JSON.stringify(invalidDuration.json));
  }

  const missing = await request("/api/services/00000000-0000-4000-8000-000000000000");
  if (missing.status === 404) {
    pass("20. Service không tồn tại");
  } else {
    fail("20. Service không tồn tại", JSON.stringify(missing.json));
  }

  const failed = results.filter((item) => !item.ok);
  console.log("\n----------------------------------------");
  console.log(`${results.filter((item) => item.ok).length}/${results.length} tests passed`);
  if (failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
