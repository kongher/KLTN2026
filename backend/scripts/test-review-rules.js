/**
 * Smoke tests for review-by-booking rules (run: node scripts/test-review-rules.js)
 * Requires DB with seeded users and at least one COMPLETED booking for customer.
 */
const prisma = require("../src/config/prisma");

async function main() {
  const completed = await prisma.booking.findFirst({
    where: { status: "COMPLETED" },
    include: { reviews: true, customer: { include: { user: true } } },
  });

  const reviewCountBefore = await prisma.review.count();
  console.log("Review count (start):", reviewCountBefore);
  console.log(
    "Sample COMPLETED booking:",
    completed
      ? { id: completed.id, hasReview: completed.reviews.length > 0, customerId: completed.customerId }
      : "none"
  );

  const uniqueBookingReviews = await prisma.$queryRaw`
    SELECT bookingId, COUNT(*) AS c FROM reviews GROUP BY bookingId HAVING c > 1
  `;
  console.log(
    "Duplicate reviews per booking:",
    uniqueBookingReviews.length === 0 ? "OK (none)" : uniqueBookingReviews
  );

  const serviceCodes = await prisma.$queryRaw`
    SELECT UPPER(code) AS k, COUNT(*) AS c FROM services GROUP BY UPPER(code) HAVING c > 1
  `;
  console.log(
    "Duplicate service codes (case-insensitive):",
    serviceCodes.length === 0 ? "OK (none)" : serviceCodes
  );

  await prisma.$disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});