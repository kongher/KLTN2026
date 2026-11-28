require("dotenv").config();
const jwt = require("jsonwebtoken");
const prisma = require("../src/config/prisma");
const { hashOtpCode } = require("../src/services/emailOtpService");

const BASE = `http://127.0.0.1:${process.env.PORT || 5000}`;
const suffix = Date.now().toString().slice(-6);

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

async function resolveOtpForEmail(email) {
  const record = await prisma.registrationOtp.findFirst({
    where: { email: email.trim().toLowerCase(), usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return null;

  for (let value = 100000; value <= 999999; value += 1) {
    const code = String(value);
    if (hashOtpCode(code) === record.otpHash) {
      return code;
    }
  }
  return null;
}

async function main() {
  const registerBody = {
    name: "Test Customer",
    email: `test.${suffix}@spa.local`,
    phone: `0987${suffix.padStart(6, "0").slice(-6)}`,
    password: "Testpass123",
  };

  const registered = await request("/api/auth/register", {
    method: "POST",
    body: registerBody,
  });

  if (
    registered.status === 200 &&
    registered.json.success &&
    registered.json.data?.expiresAt &&
  !registered.json.data?.token
  ) {
    pass("1. Customer register sends OTP");
  } else {
    fail("1. Customer register sends OTP", JSON.stringify(registered.json));
  }

  const otp = await resolveOtpForEmail(registerBody.email);
  if (!otp) {
    fail("1b. Resolve OTP for verification", "No pending registration OTP");
  }

  const beforeUser = await prisma.user.findUnique({
    where: { email: registerBody.email },
  });
  if (!beforeUser) {
    pass("1c. User not created before OTP verify");
  } else {
    fail("1c. User not created before OTP verify", "User already exists");
  }

  const verifyBad = await request("/api/auth/verify-email-otp", {
    method: "POST",
    body: { email: registerBody.email, otp: "000000" },
  });
  if (verifyBad.status === 400 && verifyBad.json.success === false) {
    pass("1d. Wrong OTP rejected");
  } else {
    fail("1d. Wrong OTP rejected", JSON.stringify(verifyBad.json));
  }

  const verified =
    otp &&
    (await request("/api/auth/verify-email-otp", {
      method: "POST",
      body: { email: registerBody.email, otp },
    }));

  let customerToken = verified?.json.data?.token;

  if (
    otp &&
    verified.status === 201 &&
    verified.json.success &&
    customerToken &&
    verified.json.data?.user?.role === "CUSTOMER"
  ) {
    pass("1e. OTP verify completes register");
  } else {
    fail("1e. OTP verify completes register", JSON.stringify(verified?.json || {}));
  }

  // 2. Login
  const loginOk = await request("/api/auth/login", {
    method: "POST",
    body: { email: registerBody.email, password: registerBody.password },
  });
  if (loginOk.status === 200 && loginOk.json.success && loginOk.json.data?.token) {
    customerToken = loginOk.json.data.token;
    pass("2. Customer login");
  } else {
    fail("2. Customer login", JSON.stringify(loginOk.json));
  }

  // 3. Wrong password
  const wrong = await request("/api/auth/login", {
    method: "POST",
    body: { email: registerBody.email, password: "Wrongpass123" },
  });
  if (wrong.status === 401 && wrong.json.success === false) {
    pass("3. Sai password");
  } else {
    fail("3. Sai password", JSON.stringify(wrong.json));
  }

  // 4. Locked user
  const user = await prisma.user.findUnique({
    where: { email: registerBody.email },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { status: "LOCKED" },
  });
  const locked = await request("/api/auth/login", {
    method: "POST",
    body: { email: registerBody.email, password: registerBody.password },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { status: "ACTIVE" },
  });
  if (
    locked.status === 403 &&
    (/lock/i.test(locked.json.message || "") || /khóa/i.test(locked.json.message || ""))
  ) {
    pass("4. User bị khóa login");
  } else {
    fail("4. User bị khóa login", JSON.stringify(locked.json));
  }

  // 5. GET /me
  const me = await request("/api/auth/me", { token: customerToken });
  if (
    me.status === 200 &&
    me.json.data?.email === registerBody.email &&
    me.json.data?.role === "CUSTOMER" &&
    me.json.data?.password === undefined
  ) {
    pass("5. GET /me");
  } else {
    fail("5. GET /me", JSON.stringify(me.json));
  }

  // 6. Change password
  const changed = await request("/api/auth/change-password", {
    method: "POST",
    token: customerToken,
    body: { currentPassword: "Testpass123", newPassword: "Newpass123" },
  });
  const relogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: registerBody.email, password: "Newpass123" },
  });
  if (changed.status === 200 && relogin.status === 200) {
    customerToken = relogin.json.data.token;
    pass("6. Change password");
  } else {
    fail("6. Change password", JSON.stringify({ changed: changed.json, relogin: relogin.json }));
  }

  // 7. Logout
  const logout = await request("/api/auth/logout", {
    method: "POST",
    token: customerToken,
  });
  if (logout.status === 200 && logout.json.success) {
    pass("7. Logout");
  } else {
    fail("7. Logout", JSON.stringify(logout.json));
  }

  // 8. Invalid JWT
  const invalid = await request("/api/auth/me", { token: "not-a-valid-jwt" });
  if (invalid.status === 401 && invalid.json.success === false) {
    pass("8. JWT invalid");
  } else {
    fail("8. JWT invalid", JSON.stringify(invalid.json));
  }

  // 9. Expired JWT
  const expiredToken = jwt.sign(
    { userId: user.id, role: "CUSTOMER", type: "access" },
    process.env.JWT_SECRET,
    { expiresIn: "1s" }
  );
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const expired = await request("/api/auth/me", { token: expiredToken });
  if (expired.status === 401 && /expired/i.test(expired.json.message || "")) {
    pass("9. JWT expired");
  } else {
    fail("9. JWT expired", JSON.stringify(expired.json));
  }

  // 10. CUSTOMER -> ADMIN API
  const customerAdmin = await request("/api/admin/access-check", {
    token: customerToken,
  });
  if (customerAdmin.status === 403) {
    pass("10. CUSTOMER truy cập ADMIN API bị từ chối");
  } else {
    fail("10. CUSTOMER truy cập ADMIN API bị từ chối", JSON.stringify(customerAdmin.json));
  }

  // 11. STAFF -> ADMIN API
  const staffLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: "lan.staff@spa.local", password: "Demo@123456" },
  });
  const staffAdmin = await request("/api/admin/access-check", {
    token: staffLogin.json.data?.token,
  });
  if (staffLogin.status === 200 && staffAdmin.status === 403) {
    pass("11. STAFF truy cập ADMIN API bị từ chối");
  } else {
    fail("11. STAFF truy cập ADMIN API bị từ chối", JSON.stringify(staffAdmin.json));
  }

  // 12. ADMIN -> ADMIN API
  const adminLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@spa.local", password: "Demo@123456" },
  });
  const adminOk = await request("/api/admin/access-check", {
    token: adminLogin.json.data?.token,
  });
  if (adminLogin.status === 200 && adminOk.status === 200 && adminOk.json.success) {
    pass("12. ADMIN truy cập ADMIN API được phép");
  } else {
    fail("12. ADMIN truy cập ADMIN API bị từ chối", JSON.stringify(adminOk.json));
  }

  const failed = results.filter((item) => !item.ok);
  console.log("\n----------------------------------------");
  console.log(`${results.filter((item) => item.ok).length}/${results.length} tests passed`);
  if (failed.length) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });