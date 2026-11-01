-- DropForeignKey
ALTER TABLE `Card` DROP FOREIGN KEY `Card_userId_fkey`;

-- DropForeignKey
ALTER TABLE `LedgerEntry` DROP FOREIGN KEY `LedgerEntry_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Logo` DROP FOREIGN KEY `Logo_businessId_fkey`;

-- DropForeignKey
ALTER TABLE `subscriptions` DROP FOREIGN KEY `subscriptions_planId_fkey`;

-- DropIndex
DROP INDEX `subscriptions_planId_fkey` ON `subscriptions`;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LedgerEntry` ADD CONSTRAINT `LedgerEntry_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Card` ADD CONSTRAINT `Card_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Logo` ADD CONSTRAINT `Logo_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
