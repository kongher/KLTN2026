ALTER TABLE `notifications`
    ADD COLUMN `actionLabel` VARCHAR(100) NULL,
    ADD COLUMN `actionPath` VARCHAR(255) NULL;