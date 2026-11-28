-- Add service code (admin-defined, unique case-insensitively via uppercase storage)
ALTER TABLE `services` ADD COLUMN `code` VARCHAR(50) NULL;

UPDATE `services` SET `code` = UPPER(CONCAT('SRV-', SUBSTRING(REPLACE(`id`, '-', ''), 1, 8)))
WHERE `code` IS NULL;

ALTER TABLE `services` MODIFY `code` VARCHAR(50) NOT NULL;

CREATE UNIQUE INDEX `services_code_key` ON `services`(`code`);