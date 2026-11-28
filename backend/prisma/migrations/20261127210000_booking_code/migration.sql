CREATE TABLE `booking_daily_sequences` (
    `dayKey` VARCHAR(8) NOT NULL,
    `lastSequence` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`dayKey`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `bookings` ADD COLUMN `bookingCode` VARCHAR(20) NULL;

UPDATE `bookings` `b`
INNER JOIN (
    SELECT
        `id`,
        CONCAT(
            'BK',
            `d`,
            LPAD(ROW_NUMBER() OVER (PARTITION BY `d` ORDER BY `createdAt`, `id`), 3, '0')
        ) AS `code`
    FROM (
        SELECT
            `id`,
            `createdAt`,
            DATE_FORMAT(CONVERT_TZ(`createdAt`, '+00:00', '+07:00'), '%Y%m%d') AS `d`
        FROM `bookings`
    ) AS `ordered`
) AS `coded` ON `b`.`id` = `coded`.`id`
SET `b`.`bookingCode` = `coded`.`code`;

INSERT INTO `booking_daily_sequences` (`dayKey`, `lastSequence`)
SELECT `d`, MAX(`seq`)
FROM (
    SELECT
        SUBSTRING(`bookingCode`, 3, 8) AS `d`,
        CAST(SUBSTRING(`bookingCode`, 11) AS UNSIGNED) AS `seq`
    FROM `bookings`
    WHERE `bookingCode` IS NOT NULL
) AS `daily`
GROUP BY `d`
ON DUPLICATE KEY UPDATE `lastSequence` = GREATEST(`booking_daily_sequences`.`lastSequence`, VALUES(`lastSequence`));

ALTER TABLE `bookings` MODIFY `bookingCode` VARCHAR(20) NOT NULL;

CREATE UNIQUE INDEX `bookings_bookingCode_key` ON `bookings`(`bookingCode`);
CREATE INDEX `bookings_bookingCode_idx` ON `bookings`(`bookingCode`);