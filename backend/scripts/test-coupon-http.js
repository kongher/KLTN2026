require("dotenv").config();
const prisma = require("../src/config/prisma");
const { signAccessToken } = require("../src/utils/jwt");

async function getAdminToken() {
  const admin = await prisma.user.findFirst({
    where: { role: { name: "ADMIN" } },
    select: { id: true, role: { select: { name: true } } },
  });
  if (!admin) throw new Error("No admin");
  return signAccessToken(admin.id, admin.role.name);
}

async function main() {
  const token = await getAdminToken();
  const customer = await prisma.user.findFirst({
    where: { email: "kongher215@gmail.com" },
    select: { id: true },
  });

  const payload = {
    name: "HTTP Test",
    code: `HTTP${Date.now()}`,
    type: "PERCENTAGE",
    value: 20,
    maxDiscountAmount: 100000,
    startDate: "2026-11-27",
    endDate: "2026-12-31",
    usageLimit: 100,
    usagePerCustomer: 1,
    customerUserIds: customer ? [customer.id] : [],
  };

  const res = await fetch("http://127.0.0.1:5000/api/coupons", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  console.log("status", res.status);
  console.log("body", JSON.stringify(body, null, 2));
}

main()
  .catch((error) => console.error(error))
  .finally(() => prisma.$disconnect());