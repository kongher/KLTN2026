require("dotenv").config();
const prisma = require("../src/config/prisma");

async function main() {
  const keep = await prisma.voucher.findFirst({
    where: { code: "KONGHER" },
    select: { id: true, code: true, name: true },
  });

  if (!keep) {
    console.error('No voucher with code "KONGHER" found. Nothing deleted.');
    return;
  }

  const removed = await prisma.voucher.deleteMany({
    where: { id: { not: keep.id } },
  });

  console.log("Kept:", keep.name, keep.code, keep.id);
  console.log("Deleted vouchers:", removed.count);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());