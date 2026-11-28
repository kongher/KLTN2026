require("dotenv").config();
const express = require("express");
const cors = require("cors");
const prisma = require("./config/prisma");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const staffRoutes = require("./routes/staffRoutes");
const customerRoutes = require("./routes/customerRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const staffBookingRoutes = require("./routes/staffBookingRoutes");
const treatmentRoutes = require("./routes/treatmentRoutes");
const customerTreatmentRoutes = require("./routes/customerTreatmentRoutes");
const staffTreatmentRoutes = require("./routes/staffTreatmentRoutes");
const adminTreatmentRoutes = require("./routes/adminTreatmentRoutes");
const adminBookingRoutes = require("./routes/adminBookingRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const homeContentRoutes = require("./routes/homeContentRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const couponRoutes = require("./routes/couponRoutes");
const inboxRoutes = require("./routes/inboxRoutes");
const { errorHandler, notFoundHandler } = require("./middlewares/errorHandler");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "OK" });
});

app.use("/api/auth", authRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/staff/bookings", staffBookingRoutes);
app.use("/api/staff/treatments", staffTreatmentRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/treatments", treatmentRoutes);
app.use("/api/customer/treatments", customerTreatmentRoutes);
app.use("/api/admin/treatments", adminTreatmentRoutes);
app.use("/api/admin/bookings", adminBookingRoutes);
app.use("/api/home", homeContentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/inbox", inboxRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

async function start() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }

  await prisma.$connect();
  app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

module.exports = app;
