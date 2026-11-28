require("dotenv").config();
const prisma = require("../src/config/prisma");
const { notifyNewBookingCreated } = require("../src/services/inboxNotificationService");

async function main() {
  const pending = await prisma.booking.findMany({
    where: { status: "PENDING" },
    include: {
      service: true,
      staff: { include: { user: { select: { name: true } } } },
      customer: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${pending.length} pending booking(s)`);

  for (const booking of pending) {
    const exists = await prisma.notification.findFirst({
      where: { message: { contains: booking.id } },
    });
    if (exists) {
      console.log("skip (already notified)", booking.id);
      continue;
    }
    await notifyNewBookingCreated(booking);
    console.log("notified", booking.id);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());