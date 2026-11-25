require("dotenv").config();
const bcrypt = require("bcrypt");
const prisma = require("../src/config/prisma");

const DEMO_PASSWORD = "Demo@123456";
const SALT_ROUNDS = 10;

function dateOnly(offsetDays = 0) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays);
}

function addMinutes(time, minutes) {
  const [hours, mins] = time.split(":").map(Number);
  const total = hours * 60 + mins + minutes;
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}:00`;
}

async function clearDatabase() {
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.treatmentRecord.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.staffSchedule.deleteMany();
  await prisma.staffService.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.service.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
}

async function ensureHomeSettings() {
  const { DEFAULT_HOME_SETTINGS } = require("../src/data/defaultHomeSettings");
  await prisma.siteSetting.upsert({
    where: { id: "home" },
    update: {},
    create: { id: "home", data: DEFAULT_HOME_SETTINGS },
  });
}

async function main() {
  console.log("Seeding spa booking database...");
  await clearDatabase();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);

  const [adminRole, staffRole, customerRole] = await Promise.all([
    prisma.role.create({ data: { name: "ADMIN" } }),
    prisma.role.create({ data: { name: "STAFF" } }),
    prisma.role.create({ data: { name: "CUSTOMER" } }),
  ]);

  const adminUser = await prisma.user.create({
    data: {
      roleId: adminRole.id,
      name: "Nguyễn Quản Trị",
      email: "admin@spa.local",
      phone: "0900000001",
      password: passwordHash,
      avatar: "https://i.pravatar.cc/150?img=12",
      status: "ACTIVE",
    },
  });

  const staffUsers = await Promise.all([
    prisma.user.create({
      data: {
        roleId: staffRole.id,
        name: "Nguyễn Thị Lan",
        email: "lan.staff@spa.local",
        phone: "0900000002",
        password: passwordHash,
        avatar: "https://i.pravatar.cc/150?img=32",
        status: "ACTIVE",
      },
    }),
    prisma.user.create({
      data: {
        roleId: staffRole.id,
        name: "Trần Văn Minh",
        email: "minh.staff@spa.local",
        phone: "0900000003",
        password: passwordHash,
        avatar: "https://i.pravatar.cc/150?img=14",
        status: "ACTIVE",
      },
    }),
    prisma.user.create({
      data: {
        roleId: staffRole.id,
        name: "Lê Thị Hương",
        email: "huong.staff@spa.local",
        phone: "0900000004",
        password: passwordHash,
        avatar: "https://i.pravatar.cc/150?img=47",
        status: "ACTIVE",
      },
    }),
  ]);

  const customerUsers = await Promise.all([
    prisma.user.create({
      data: {
        roleId: customerRole.id,
        name: "Nguyễn Thị An",
        email: "an.customer@spa.local",
        phone: "0910000001",
        password: passwordHash,
        avatar: "https://i.pravatar.cc/150?img=5",
        status: "ACTIVE",
      },
    }),
    prisma.user.create({
      data: {
        roleId: customerRole.id,
        name: "Phạm Văn Bình",
        email: "binh.customer@spa.local",
        phone: "0910000002",
        password: passwordHash,
        avatar: "https://i.pravatar.cc/150?img=8",
        status: "ACTIVE",
      },
    }),
    prisma.user.create({
      data: {
        roleId: customerRole.id,
        name: "Trần Thị Chi",
        email: "chi.customer@spa.local",
        phone: "0910000003",
        password: passwordHash,
        avatar: "https://i.pravatar.cc/150?img=9",
        status: "ACTIVE",
      },
    }),
    prisma.user.create({
      data: {
        roleId: customerRole.id,
        name: "Lê Văn Dũng",
        email: "dung.customer@spa.local",
        phone: "0910000004",
        password: passwordHash,
        avatar: "https://i.pravatar.cc/150?img=11",
        status: "ACTIVE",
      },
    }),
    prisma.user.create({
      data: {
        roleId: customerRole.id,
        name: "Hoàng Thị Em",
        email: "em.customer@spa.local",
        phone: "0910000005",
        password: passwordHash,
        avatar: "https://i.pravatar.cc/150?img=20",
        status: "ACTIVE",
      },
    }),
  ]);

  const [staffLan, staffMinh, staffHuong] = await Promise.all([
    prisma.staff.create({
      data: {
        userId: staffUsers[0].id,
        specialization: "Chăm sóc da mặt",
        status: "ACTIVE",
      },
    }),
    prisma.staff.create({
      data: {
        userId: staffUsers[1].id,
        specialization: "Massage trị liệu",
        status: "ACTIVE",
      },
    }),
    prisma.staff.create({
      data: {
        userId: staffUsers[2].id,
        specialization: "Chăm sóc body",
        status: "ACTIVE",
      },
    }),
  ]);

  const customers = await Promise.all(
    customerUsers.map((user, index) =>
      prisma.customer.create({
        data: {
          userId: user.id,
          dateOfBirth: new Date(1995 + index, index, 10 + index),
          gender: index % 2 === 0 ? "FEMALE" : "MALE",
          address: `${100 + index} Nguyễn Huệ, Quận 1, TP.HCM`,
        },
      })
    )
  );

  const [facialCategory, massageCategory, bodyCategory] = await Promise.all([
    prisma.serviceCategory.create({
      data: {
        name: "Chăm sóc da mặt",
        description: "Các liệu trình làm sạch, dưỡng ẩm và điều trị da mặt.",
        status: "ACTIVE",
      },
    }),
    prisma.serviceCategory.create({
      data: {
        name: "Massage & thư giãn",
        description: "Các liệu trình massage giảm stress và phục hồi cơ thể.",
        status: "ACTIVE",
      },
    }),
    prisma.serviceCategory.create({
      data: {
        name: "Chăm sóc body",
        description: "Tẩy tế bào chết, ủ trắng và chăm sóc toàn thân.",
        status: "ACTIVE",
      },
    }),
  ]);

  const [facialBasic, facialAcne, massageBody, massageHotStone, bodyScrub] =
    await Promise.all([
      prisma.service.create({
        data: {
          categoryId: facialCategory.id,
          name: "Facial cơ bản",
          description: "Làm sạch sâu, tẩy tế bào chết và dưỡng ẩm da mặt.",
          price: "350000.00",
          duration: 60,
          image: "/images/services/facial-basic.jpg",
          status: "ACTIVE",
        },
      }),
      prisma.service.create({
        data: {
          categoryId: facialCategory.id,
          name: "Facial trị mụn",
          description: "Điều trị mụn, giảm viêm và phục hồi da tổn thương.",
          price: "450000.00",
          duration: 75,
          image: "/images/services/facial-acne.jpg",
          status: "ACTIVE",
        },
      }),
      prisma.service.create({
        data: {
          categoryId: massageCategory.id,
          name: "Massage body",
          description: "Massage toàn thân giúp thư giãn và giảm đau cơ.",
          price: "500000.00",
          duration: 90,
          image: "/images/services/massage-body.jpg",
          status: "ACTIVE",
        },
      }),
      prisma.service.create({
        data: {
          categoryId: massageCategory.id,
          name: "Massage đá nóng",
          description: "Massage kết hợp đá nóng, tăng tuần hoàn máu.",
          price: "650000.00",
          duration: 90,
          image: "/images/services/massage-hot-stone.jpg",
          status: "ACTIVE",
        },
      }),
      prisma.service.create({
        data: {
          categoryId: bodyCategory.id,
          name: "Tẩy tế bào chết body",
          description: "Làm sạch da toàn thân, giúp da mịn và sáng hơn.",
          price: "400000.00",
          duration: 60,
          image: "/images/services/body-scrub.jpg",
          status: "ACTIVE",
        },
      }),
    ]);

  await prisma.staffService.createMany({
    data: [
      { staffId: staffLan.id, serviceId: facialBasic.id },
      { staffId: staffLan.id, serviceId: facialAcne.id },
      { staffId: staffMinh.id, serviceId: massageBody.id },
      { staffId: staffMinh.id, serviceId: massageHotStone.id },
      { staffId: staffHuong.id, serviceId: bodyScrub.id },
      { staffId: staffHuong.id, serviceId: massageBody.id },
    ],
  });

  const scheduleRows = [];
  for (let dayOffset = 0; dayOffset < 14; dayOffset += 1) {
    const date = dateOnly(dayOffset);
    const isSunday = date.getDay() === 0;

    for (const staff of [staffLan, staffMinh, staffHuong]) {
      if (isSunday) {
        scheduleRows.push({
          staffId: staff.id,
          date,
          startTime: "09:00:00",
          endTime: "17:00:00",
          status: "OFF",
        });
        continue;
      }

      scheduleRows.push(
        {
          staffId: staff.id,
          date,
          startTime: "09:00:00",
          endTime: "12:00:00",
          status: "AVAILABLE",
        },
        {
          staffId: staff.id,
          date,
          startTime: "13:00:00",
          endTime: "18:00:00",
          status: "AVAILABLE",
        }
      );
    }
  }

  await prisma.staffSchedule.createMany({ data: scheduleRows });

  const [voucherWelcome, voucherFixed, voucherSummer] = await Promise.all([
    prisma.voucher.create({
      data: {
        code: "WELCOME10",
        type: "PERCENTAGE",
        value: "10.00",
        startDate: dateOnly(-7),
        endDate: dateOnly(60),
        usageLimit: 100,
        usedCount: 1,
        status: "ACTIVE",
      },
    }),
    prisma.voucher.create({
      data: {
        code: "SPA50K",
        type: "FIXED",
        value: "50000.00",
        startDate: dateOnly(-7),
        endDate: dateOnly(30),
        usageLimit: 50,
        usedCount: 0,
        status: "ACTIVE",
      },
    }),
    prisma.voucher.create({
      data: {
        code: "SUMMER20",
        type: "PERCENTAGE",
        value: "20.00",
        startDate: dateOnly(-30),
        endDate: dateOnly(-1),
        usageLimit: 20,
        usedCount: 20,
        status: "EXPIRED",
      },
    }),
  ]);

  const pendingBooking = await prisma.booking.create({
    data: {
      customerId: customers[0].id,
      staffId: staffLan.id,
      serviceId: facialBasic.id,
      voucherId: voucherWelcome.id,
      bookingDate: dateOnly(1),
      startTime: "09:00:00",
      endTime: addMinutes("09:00:00", facialBasic.duration),
      status: "PENDING",
      note: "Khách muốn dùng sữa rửa mặt dịu nhẹ.",
      totalPrice: "315000.00",
    },
  });

  const confirmedBooking = await prisma.booking.create({
    data: {
      customerId: customers[1].id,
      staffId: staffMinh.id,
      serviceId: massageBody.id,
      bookingDate: dateOnly(1),
      startTime: "14:00:00",
      endTime: addMinutes("14:00:00", massageBody.duration),
      status: "CONFIRMED",
      note: "Tập trung vùng vai gáy.",
      totalPrice: "500000.00",
    },
  });

  const completedBooking1 = await prisma.booking.create({
    data: {
      customerId: customers[2].id,
      staffId: staffHuong.id,
      serviceId: bodyScrub.id,
      bookingDate: dateOnly(-5),
      startTime: "10:00:00",
      endTime: addMinutes("10:00:00", bodyScrub.duration),
      status: "COMPLETED",
      note: "Đã hoàn thành liệu trình tẩy tế bào chết.",
      totalPrice: "400000.00",
    },
  });

  const completedBooking2 = await prisma.booking.create({
    data: {
      customerId: customers[4].id,
      staffId: staffLan.id,
      serviceId: facialAcne.id,
      bookingDate: dateOnly(-3),
      startTime: "15:00:00",
      endTime: addMinutes("15:00:00", facialAcne.duration),
      status: "COMPLETED",
      note: "Da có mụn viêm nhẹ.",
      totalPrice: "450000.00",
    },
  });

  const cancelledBooking = await prisma.booking.create({
    data: {
      customerId: customers[3].id,
      staffId: staffLan.id,
      serviceId: facialBasic.id,
      bookingDate: dateOnly(-1),
      startTime: "09:30:00",
      endTime: addMinutes("09:30:00", facialBasic.duration),
      status: "CANCELLED",
      note: "Khách báo bận đột xuất.",
      totalPrice: "350000.00",
    },
  });

  const rejectedBooking = await prisma.booking.create({
    data: {
      customerId: customers[0].id,
      staffId: staffMinh.id,
      serviceId: massageHotStone.id,
      bookingDate: dateOnly(2),
      startTime: "16:00:00",
      endTime: addMinutes("16:00:00", massageHotStone.duration),
      status: "REJECTED",
      note: "Khung giờ đã kín lịch, khách chưa chọn giờ khác.",
      totalPrice: "650000.00",
    },
  });

  await prisma.treatmentRecord.createMany({
    data: [
      {
        customerId: customers[2].id,
        bookingId: completedBooking1.id,
        serviceId: bodyScrub.id,
        staffId: staffHuong.id,
        note: "Da khô nhẹ. Đã dùng sản phẩm dịu nhẹ, khách hài lòng.",
        beforeImage: "/images/treatments/chi-before.jpg",
        afterImage: "/images/treatments/chi-after.jpg",
      },
      {
        customerId: customers[4].id,
        bookingId: completedBooking2.id,
        serviceId: facialAcne.id,
        staffId: staffLan.id,
        note: "Giảm viêm mụn rõ. Hẹn tái khám sau 2 tuần.",
        beforeImage: "/images/treatments/em-before.jpg",
        afterImage: "/images/treatments/em-after.jpg",
      },
    ],
  });

  await prisma.review.createMany({
    data: [
      {
        customerId: customers[2].id,
        serviceId: bodyScrub.id,
        staffId: staffHuong.id,
        bookingId: completedBooking1.id,
        rating: 5,
        comment: "Liệu trình rất dễ chịu, da mịn hơn rõ rệt.",
        status: "VISIBLE",
      },
      {
        customerId: customers[4].id,
        serviceId: facialAcne.id,
        staffId: staffLan.id,
        bookingId: completedBooking2.id,
        rating: 4,
        comment: "Chuyên viên tư vấn kỹ, mụn giảm sau buổi đầu.",
        status: "VISIBLE",
      },
      {
        customerId: customers[3].id,
        serviceId: facialBasic.id,
        staffId: staffLan.id,
        bookingId: cancelledBooking.id,
        rating: 2,
        comment: "Phải hủy lịch nên chưa trải nghiệm đầy đủ.",
        status: "HIDDEN",
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: customers[0].userId,
        title: "Đặt lịch đang chờ xác nhận",
        message: "Lịch Facial cơ bản của bạn đang ở trạng thái PENDING.",
        isRead: false,
      },
      {
        userId: customers[1].userId,
        title: "Đặt lịch đã được xác nhận",
        message: "Lịch Massage body đã CONFIRMED. Vui lòng đến trước 10 phút.",
        isRead: false,
      },
      {
        userId: customers[2].userId,
        title: "Hoàn thành liệu trình",
        message: "Cảm ơn bạn đã sử dụng dịch vụ Tẩy tế bào chết body.",
        isRead: true,
      },
      {
        userId: staffUsers[0].id,
        title: "Có lịch mới",
        message: "Bạn có một booking Facial cơ bản đang chờ xác nhận.",
        isRead: false,
      },
      {
        userId: adminUser.id,
        title: "Hệ thống đã sẵn sàng",
        message: "Dữ liệu mẫu Phase 1 đã được seed thành công.",
        isRead: true,
      },
    ],
  });

  await ensureHomeSettings();

  console.log("Seed completed.");
  console.log("Demo password for all accounts:", DEMO_PASSWORD);
  console.log({
    roles: ["ADMIN", "STAFF", "CUSTOMER"],
    admin: adminUser.email,
    staff: staffUsers.map((user) => user.email),
    customers: customerUsers.map((user) => user.email),
    categories: 3,
    services: 5,
    bookings: [
      pendingBooking.status,
      confirmedBooking.status,
      completedBooking1.status,
      completedBooking2.status,
      cancelledBooking.status,
      rejectedBooking.status,
    ],
    vouchers: [voucherWelcome.code, voucherFixed.code, voucherSummer.code],
  });
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
