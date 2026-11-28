-- AlterTable
ALTER TABLE `users` ADD COLUMN `marketingEmailOptIn` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `email_notifications` (
    `id` CHAR(36) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `content` TEXT NOT NULL,
    `targetType` ENUM('ALL_STAFF', 'ALL_CUSTOMER', 'SPECIFIC') NOT NULL,
    `category` ENUM('OPERATIONAL', 'PROMOTIONAL') NOT NULL DEFAULT 'OPERATIONAL',
    `createdById` CHAR(36) NOT NULL,
    `sentSuccess` INTEGER NOT NULL DEFAULT 0,
    `sentFailed` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `email_notifications_createdById_idx`(`createdById`),
    INDEX `email_notifications_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_notification_recipients` (
    `id` CHAR(36) NOT NULL,
    `notificationId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `sentAt` DATETIME(3) NULL,
    `errorMessage` TEXT NULL,

    INDEX `email_notification_recipients_notificationId_idx`(`notificationId`),
    INDEX `email_notification_recipients_userId_idx`(`userId`),
    INDEX `email_notification_recipients_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `email_notifications` ADD CONSTRAINT `email_notifications_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_notification_recipients` ADD CONSTRAINT `email_notification_recipients_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `email_notifications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_notification_recipients` ADD CONSTRAINT `email_notification_recipients_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;