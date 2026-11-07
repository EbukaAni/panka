/*
  Warnings:

  - Added the required column `providerId` to the `subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `subscriptions` ADD COLUMN `providerId` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `WebhookEvent` (
    `id` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
