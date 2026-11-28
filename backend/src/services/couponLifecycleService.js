const prisma = require("../config/prisma");
const { isVoucherInDateRange } = require("../utils/couponDiscount");

async function releaseCustomerCouponForBooking(bookingId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { customerCouponId: true },
  });
  if (!booking?.customerCouponId) return;

  const coupon = await prisma.customerCoupon.findUnique({
    where: { id: booking.customerCouponId },
    include: { voucher: true },
  });
  if (!coupon || coupon.status !== "RESERVED") return;

  const now = new Date();
  const stillValid =
    coupon.voucher.status === "ACTIVE" && isVoucherInDateRange(coupon.voucher, now);

  await prisma.customerCoupon.update({
    where: { id: coupon.id },
    data: {
      status: stillValid ? "AVAILABLE" : "EXPIRED",
      reservedAt: null,
    },
  });
}

async function markCustomerCouponUsedForBooking(bookingId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { customerCouponId: true, voucherId: true },
  });
  if (!booking?.customerCouponId) return;

  await prisma.$transaction(async (tx) => {
    const updated = await tx.customerCoupon.updateMany({
      where: { id: booking.customerCouponId, status: "RESERVED" },
      data: { status: "USED", usedAt: new Date() },
    });
    if (updated.count !== 1) return;

    if (booking.voucherId) {
      await tx.voucher.update({
        where: { id: booking.voucherId },
        data: { usedCount: { increment: 1 } },
      });
    }
  });
}

module.exports = {
  releaseCustomerCouponForBooking,
  markCustomerCouponUsedForBooking,
};