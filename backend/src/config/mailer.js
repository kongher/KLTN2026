const nodemailer = require("nodemailer");

let cachedTransporter = null;

function isSmtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

function getMailTransporter() {
  if (!isSmtpConfigured()) {
    return null;
  }

  if (!cachedTransporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return cachedTransporter;
}

function getMailFromAddress() {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  return from ? String(from).trim() : null;
}

module.exports = {
  getMailTransporter,
  getMailFromAddress,
  isSmtpConfigured,
};