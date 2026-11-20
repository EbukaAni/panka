/*
  Warnings:

  - A unique constraint covering the columns `[providerId]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,status]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.
  - Made the column `endDate` on table `subscriptions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `providerId` on table `subscriptions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `subscriptions` MODIFY `endDate` DATETIME(3) NOT NULL,
    MODIFY `providerId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `subscriptions_providerId_key` ON `subscriptions`(`providerId`);

-- CreateIndex
CREATE UNIQUE INDEX `subscriptions_userId_status_key` ON `subscriptions`(`userId`, `status`);
