-- Extend vouchers for personalized coupons
ALTER TABLE `vouchers`
    ADD COLUMN `name` VARCHAR(150) NOT NULL DEFAULT '' AFTER `code`,
    ADD COLUMN `description` TEXT NULL AFTER `name`,
    ADD COLUMN `maxDiscountAmount` DECIMAL(12, 2) NULL AFTER `value`,
    ADD COLUMN `minOrderAmount` DECIMAL(12, 2) NULL AFTER `maxDiscountAmount`,
    ADD COLUMN `usagePerCustomer` INTEGER NOT NULL DEFAULT 1 AFTER `usageLimit`,
    ADD COLUMN `isPersonalized` BOOLEAN NOT NULL DEFAULT true AFTER `usedCount`;

UPDATE `vouchers` SET `name` = `code` WHERE `name` = '' OR `name` IS NULL;

-- Customer coupon assignments
CREATE TABLE `customer_coupons` (
    `id` CHAR(36) NOT NULL,
    `voucherId` CHAR(36) NOT NULL,
    `customerId` CHAR(36) NOT NULL,
    `status` ENUM('AVAILABLE', 'RESERVED', 'USED', 'EXPIRED', 'REVOKED') NOT NULL DEFAULT 'AVAILABLE',
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reservedAt` DATETIME(3) NULL,
    `usedAt` DATETIME(3) NULL,
    `emailStatus` ENUM('PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `emailSentAt` DATETIME(3) NULL,
    `emailError` TEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `customer_coupons_voucherId_customerId_key`(`voucherId`, `customerId`),
    INDEX `customer_coupons_customerId_status_idx`(`customerId`, `status`),
    INDEX `customer_coupons_voucherId_idx`(`voucherId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `bookings`
    ADD COLUMN `customerCouponId` CHAR(36) NULL;

CREATE UNIQUE INDEX `bookings_customerCouponId_key` ON `bookings`(`customerCouponId`);

ALTER TABLE `customer_coupons` ADD CONSTRAINT `customer_coupons_voucherId_fkey` FOREIGN KEY (`voucherId`) REFERENCES `vouchers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `customer_coupons` ADD CONSTRAINT `customer_coupons_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_customerCouponId_fkey` FOREIGN KEY (`customerCouponId`) REFERENCES `customer_coupons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;