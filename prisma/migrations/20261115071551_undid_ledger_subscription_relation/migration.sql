/*
  Warnings:

  - You are about to drop the column `subscriptionId` on the `LedgerEntry` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `LedgerEntry` DROP FOREIGN KEY `LedgerEntry_subscriptionId_fkey`;

-- DropIndex
DROP INDEX `LedgerEntry_subscriptionId_fkey` ON `LedgerEntry`;

-- AlterTable
ALTER TABLE `LedgerEntry` DROP COLUMN `subscriptionId`;
