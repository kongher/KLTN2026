require("dotenv").config();
const prisma = require("../src/config/prisma");
const couponService = require("../src/services/couponService");

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: "kongher215@gmail.com" },
    select: { id: true, email: true },
  });
  console.log("customer user", user);

  const payload = {
    name: "Test Program",
    code: `TEST${Date.now()}`,
    type: "PERCENTAGE",
    value: 20,
    maxDiscountAmount: 100000,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    usageLimit: 100,
    usagePerCustomer: 1,
    customerUserIds: user ? [user.id] : [],
  };

  try {
    const result = await couponService.createCouponAndAssign(payload);
    console.log("OK", result);
  } catch (error) {
    console.error("ERR", error.message);
    console.error(error.stack);
    if (error.code) console.error("code", error.code);
    if (error.meta) console.error("meta", error.meta);
  }
}

main()
  .catch((error) => console.error(error))
  .finally(() => prisma.$disconnect());