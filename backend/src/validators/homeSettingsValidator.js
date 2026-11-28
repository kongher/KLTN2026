const validate = require("../middlewares/validate");
const { isNonEmptyString, optionalString } = require("./common");

function arrayOfObjects(value, min, max) {
  return Array.isArray(value) && value.length >= min && value.length <= max;
}

function validateSettings(req) {
  const errors = [];
  const body = req.body || {};

  if (!isNonEmptyString(body.name) || body.name.trim().length < 2) {
    errors.push("Tên spa là bắt buộc");
  }
  if (!isNonEmptyString(body.tagline)) {
    errors.push("Khẩu hiệu là bắt buộc");
  }
  if (!optionalString(body.description, 2000)) errors.push("Mô tả quá dài");
  if (!optionalString(body.aboutTitle, 200)) errors.push("Tiêu đề giới thiệu quá dài");
  if (!optionalString(body.aboutDescription, 2000)) errors.push("Mô tả giới thiệu quá dài");
  if (!optionalString(body.address, 255)) errors.push("Địa chỉ quá dài");
  if (!optionalString(body.phone, 30)) errors.push("Số điện thoại không hợp lệ");
  if (!optionalString(body.email, 120)) errors.push("Email quá dài");
  if (!optionalString(body.hoursWeekday, 120)) errors.push("Giờ mở cửa quá dài");
  if (!optionalString(body.hoursWeekend, 120)) errors.push("Giờ cuối tuần quá dài");
  if (!optionalString(body.mapSrc, 1000)) errors.push("Link bản đồ quá dài");
  if (!optionalString(body.facebook, 300)) errors.push("Link Facebook quá dài");
  if (!optionalString(body.instagram, 300)) errors.push("Link Instagram quá dài");
  if (!optionalString(body.zalo, 300)) errors.push("Link Zalo quá dài");
  if (!optionalString(body.heroImage, 500)) errors.push("Ảnh hero quá dài");
  if (!optionalString(body.heroVideo, 500)) errors.push("Video hero quá dài");

  if (body.aboutPoints !== undefined && !arrayOfObjects(body.aboutPoints, 0, 6)) {
    errors.push("Tối đa 6 điểm nổi bật");
  }
  if (body.aboutStats !== undefined && !arrayOfObjects(body.aboutStats, 0, 8)) {
    errors.push("Tối đa 8 chỉ số uy tín");
  }
  if (body.gallery !== undefined && !arrayOfObjects(body.gallery, 0, 8)) {
    errors.push("Tối đa 8 ảnh không gian");
  }
  if (body.testimonials !== undefined && !arrayOfObjects(body.testimonials, 0, 8)) {
    errors.push("Tối đa 8 đánh giá");
  }
  if (body.promotions !== undefined && !arrayOfObjects(body.promotions, 0, 8)) {
    errors.push("Tối đa 8 ưu đãi");
  }
  if (body.bannerSlides !== undefined && !arrayOfObjects(body.bannerSlides, 0, 12)) {
    errors.push("Tối đa 12 ảnh banner");
  }

  return errors;
}

const update = validate(validateSettings);

module.exports = { update };
