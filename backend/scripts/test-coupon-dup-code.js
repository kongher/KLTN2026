require("dotenv").config();
const prisma = require("../src/config/prisma");
const { signAccessToken } = require("../src/utils/jwt");

async function postCoupon(token, code) {
  const customer = await prisma.user.findFirst({
    where: { email: "kongher215@gmail.com" },
    select: { id: true },
  });
  const res = await fetch("http://127.0.0.1:5000/api/coupons", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Dup test",
      code,
      type: "PERCENTAGE",
      value: 20,
      startDate: "2026-11-27",
      endDate: "2026-12-31",
      usageLimit: 100,
      usagePerCustomer: 1,
      customerUserIds: [customer.id],
    }),
  });
  return { status: res.status, body: await res.json() };
}

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: { name: "ADMIN" } },
    select: { id: true, role: { select: { name: true } } },
  });
  const token = signAccessToken(admin.id, admin.role.name);
  const code = "DUPLICATETEST";
  console.log("first", await postCoupon(token, code));
  console.log("second", await postCoupon(token, code));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());