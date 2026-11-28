const AppError = require("../utils/appError");
const { escapeHtml, textToHtmlParagraphs } = require("../utils/htmlEscape");
const { getMailFromAddress, getMailTransporter, isSmtpConfigured } = require("../config/mailer");

function buildOtpEmailContent(otpCode, name) {
  const greeting = name ? `Xin chào ${name},` : "Xin chào,";
  const text = [
    greeting,
    "",
    "Mã xác thực đăng ký tài khoản Lumina Spa của bạn là:",
    "",
    otpCode,
    "",
    "Mã có hiệu lực trong 5 phút và chỉ dùng một lần.",
    "Nếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này.",
  ].join("\n");

  const html = `
    <h1 style="color: #3f5140; font-family: 'Segoe UI', system-ui, sans-serif;">Xác thực email</h1>
    <p style="font-family: 'Segoe UI', system-ui, sans-serif; color: #263026;">${greeting}</p>
    <p style="font-family: 'Segoe UI', system-ui, sans-serif; color: #263026;">
      Mã OTP đăng ký tài khoản của bạn:
    </p>
    <p style="font-size: 28px; letter-spacing: 0.35em; font-weight: 600; color: #c9a46c; font-family: 'Segoe UI', system-ui, sans-serif;">
      ${otpCode}
    </p>
    <p style="font-family: 'Segoe UI', system-ui, sans-serif; color: #7a8178; font-size: 14px;">
      Mã hết hạn sau 5 phút và chỉ sử dụng được một lần.
    </p>
  `;

  return { text, html };
}

async function sendRegistrationOtpEmail({ to, name, otpCode }) {
  if (!isSmtpConfigured()) {
    throw new AppError(
      "Email service is not available. Please try again later.",
      503
    );
  }

  const transporter = getMailTransporter();
  const from = getMailFromAddress();

  if (!transporter || !from) {
    throw new AppError(
      "Email service is not available. Please try again later.",
      503
    );
  }

  const { text, html } = buildOtpEmailContent(otpCode, name);

  try {
    await transporter.sendMail({
      from,
      to,
      subject: "Mã xác thực đăng ký — Lumina Spa",
      text,
      html,
    });
  } catch {
    throw new AppError(
      "Unable to send verification email. Please try again later.",
      503
    );
  }
}

function buildBroadcastEmailContent({ name, title, content, sentAt }) {
  const greeting = name ? `Xin chào ${escapeHtml(name)},` : "Xin chào,";
  const sentLabel = sentAt
    ? new Date(sentAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
    : new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

  const text = [
    greeting.replace(/&[^;]+;/g, (entity) => {
      if (entity === "&amp;") return "&";
      return entity;
    }),
    "",
    title,
    "",
    content,
    "",
    `Gửi lúc: ${sentLabel}`,
    "",
    "Lumina Spa — hello@luminaspa.vn",
  ].join("\n");

  return {
    text,
    html: `
    <input type="hidden" />
    <div style="font-family:'Segoe UI',system-ui,sans-serif;background:#f7f5f0;padding:24px;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px;border:1px solid #e8e4dc;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#c9a46c;">Lumina Spa</p>
        <h1 style="margin:0 0 16px;font-size:22px;color:#3f5140;">${escapeHtml(title)}</h1>
        <p style="margin:0 0 16px;color:#263026;">${greeting}</p>
        ${textToHtmlParagraphs(content)}
        <p style="margin:20px 0 0;font-size:12px;color:#7a8178;">Gửi lúc: ${escapeHtml(sentLabel)}</p>
        <hr style="border:none;border-top:1px solid #e8e4dc;margin:24px 0;" />
        <p style="margin:0;font-size:12px;color:#7a8178;">Lumina Spa — Chăm sóc & đặt lịch trực tuyến</p>
      </div>
    </div>
    `,
  };
}

async function sendBroadcastEmail({ to, name, title, content, sentAt }) {
  if (!isSmtpConfigured()) {
    throw new AppError("Email service is not available", 503);
  }

  const transporter = getMailTransporter();
  const from = getMailFromAddress();
  if (!transporter || !from) {
    throw new AppError("Email service is not available", 503);
  }

  const { text, html } = buildBroadcastEmailContent({ name, title, content, sentAt });

  await transporter.sendMail({
    from,
    to,
    subject: `${title} — Lumina Spa`,
    text,
    html,
  });
}

function formatVnd(value) {
  return `${Number(value).toLocaleString("vi-VN")}đ`;
}

function buildCouponAssignedEmail({ name, voucher }) {
  const greeting = name ? `Xin chào ${escapeHtml(name)},` : "Xin chào,";
  const discount =
    voucher.type === "PERCENTAGE"
      ? `Giảm ${Number(voucher.value)}%${
          voucher.maxDiscountAmount != null
            ? ` (tối đa ${formatVnd(voucher.maxDiscountAmount)})`
            : ""
        }`
      : `Giảm ${formatVnd(voucher.value)}`;

  const minOrder =
    voucher.minOrderAmount != null
      ? `<p style="margin:0 0 8px;color:#263026;"><strong>Đơn tối thiểu:</strong> ${formatVnd(
          voucher.minOrderAmount
        )}</p>`
      : "";

  const start = new Date(voucher.startDate).toLocaleDateString("vi-VN");
  const end = new Date(voucher.endDate).toLocaleDateString("vi-VN");

  const text = [
    greeting.replace(/<[^>]+>/g, ""),
    "",
    `Bạn vừa được cấp mã giảm giá từ Lumina Spa: ${voucher.code}`,
    `Chương trình: ${voucher.name}`,
    discount,
    voucher.description || "",
    `Hiệu lực: ${start} – ${end}`,
    "",
    "Đăng nhập website, vào mục Ưu đãi của tôi hoặc đặt lịch để chọn mã và nhấn Sử dụng — không cần nhập mã thủ công.",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family:'Segoe UI',system-ui,sans-serif;background:#f7f5f0;padding:24px;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px;border:1px solid #e8e4dc;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#c9a46c;">Lumina Spa</p>
        <h1 style="margin:0 0 16px;font-size:22px;color:#3f5140;">Ưu đãi dành riêng cho bạn</h1>
        <p style="margin:0 0 16px;color:#263026;">${greeting}</p>
        <p style="margin:0 0 8px;color:#263026;">Chương trình: <strong>${escapeHtml(voucher.name)}</strong></p>
        <p style="margin:0 0 8px;color:#263026;">Mã: <strong style="color:#c9a46c;letter-spacing:0.15em;">${escapeHtml(voucher.code)}</strong></p>
        <p style="margin:0 0 8px;color:#263026;"><strong>Giá trị:</strong> ${escapeHtml(discount)}</p>
        ${voucher.description ? `<p style="margin:0 0 12px;color:#7a8178;">${escapeHtml(voucher.description)}</p>` : ""}
        ${minOrder}
        <p style="margin:0 0 8px;color:#263026;"><strong>Hiệu lực:</strong> ${escapeHtml(start)} – ${escapeHtml(end)}</p>
        <p style="margin:16px 0 0;color:#263026;">Đăng nhập và đặt lịch trên website — tại bước xác nhận, chọn mã trong mục <em>Ưu đãi dành riêng cho bạn</em> và nhấn <strong>Sử dụng</strong>.</p>
      </div>
    </div>
  `;

  return { text, html };
}

async function sendCouponAssignedEmail({ to, name, voucher }) {
  if (!isSmtpConfigured()) {
    throw new Error("Email service is not configured");
  }

  const transporter = getMailTransporter();
  const from = getMailFromAddress();
  if (!transporter || !from) {
    throw new Error("Email transporter is not available");
  }

  const { text, html } = buildCouponAssignedEmail({ name, voucher });

  await transporter.sendMail({
    from,
    to,
    subject: `Mã giảm giá ${voucher.code} — Lumina Spa`,
    text,
    html,
  });
}

module.exports = {
  sendRegistrationOtpEmail,
  sendBroadcastEmail,
  buildBroadcastEmailContent,
  sendCouponAssignedEmail,
};