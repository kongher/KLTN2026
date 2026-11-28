require("dotenv").config();
const prisma = require("../src/config/prisma");

async function main() {
  const voucher = await prisma.voucher.create({
    data: {
      code: `CM${Date.now()}`,
      name: "createMany test",
      type: "FIXED",
      value: 1000,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      usageLimit: 10,
      isPersonalized: true,
    },
  });
  const customer = await prisma.customer.findFirst();

  try {
    const result = await prisma.customerCoupon.createMany({
      data: [{ voucherId: voucher.id, customerId: customer.id }],
      skipDuplicates: true,
    });
    console.log("createMany OK", result);
  } catch (error) {
    console.error("createMany FAIL", error.code, error.message);
  }

  await prisma.voucher.delete({ where: { id: voucher.id } }).catch(() => {});
}

main()
  .catch((error) => console.error(error))
  .finally(() => prisma.$disconnect());