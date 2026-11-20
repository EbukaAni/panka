/*
  Warnings:

  - You are about to drop the column `paymentMethod` on the `LedgerEntry` table. All the data in the column will be lost.
  - You are about to drop the column `transactionType` on the `LedgerEntry` table. All the data in the column will be lost.
  - The values [REFUNDED,PENDING,CANCELED] on the enum `LedgerEntry_status` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `periodEnd` to the `LedgerEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodStart` to the `LedgerEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subscriptionId` to the `LedgerEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `LedgerEntry` DROP COLUMN `paymentMethod`,
    DROP COLUMN `transactionType`,
    ADD COLUMN `periodEnd` DATETIME(3) NOT NULL,
    ADD COLUMN `periodStart` DATETIME(3) NOT NULL,
    ADD COLUMN `subscriptionId` INTEGER NOT NULL,
    MODIFY `status` ENUM('PAID', 'FAILED') NOT NULL;

-- AddForeignKey
ALTER TABLE `LedgerEntry` ADD CONSTRAINT `LedgerEntry_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `subscriptions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
