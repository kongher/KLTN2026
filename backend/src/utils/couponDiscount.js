function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

function formatDiscountLabel(voucher) {
  if (voucher.type === "PERCENTAGE") {
    const max =
      voucher.maxDiscountAmount != null
        ? ` (tối đa ${Number(voucher.maxDiscountAmount).toLocaleString("vi-VN")}đ)`
        : "";
    return `Giảm ${Number(voucher.value)}%${max}`;
  }
  return `Giảm ${Number(voucher.value).toLocaleString("vi-VN")}đ`;
}

function computeDiscountAmount(voucher, originalAmount) {
  const amount = Number(originalAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { originalAmount: 0, discountAmount: 0, totalAmount: 0 };
  }

  let discount = 0;
  if (voucher.type === "PERCENTAGE") {
    discount = (amount * Number(voucher.value)) / 100;
    if (voucher.maxDiscountAmount != null) {
      discount = Math.min(discount, Number(voucher.maxDiscountAmount));
    }
  } else {
    discount = Number(voucher.value);
  }

  discount = Math.min(discount, amount);
  const total = amount - discount;

  return {
    originalAmount: roundMoney(amount),
    discountAmount: roundMoney(discount),
    totalAmount: roundMoney(total),
  };
}

function isVoucherInDateRange(voucher, now = new Date()) {
  const start = new Date(voucher.startDate);
  const end = new Date(voucher.endDate);
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(23, 59, 59, 999);
  return now >= start && now <= end;
}

module.exports = {
  computeDiscountAmount,
  formatDiscountLabel,
  isVoucherInDateRange,
  roundMoney,
};