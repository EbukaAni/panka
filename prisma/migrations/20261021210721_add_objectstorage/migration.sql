/*
  Warnings:

  - You are about to drop the column `logo` on the `businesses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `businesses` DROP COLUMN `logo`;

-- CreateTable
CREATE TABLE `Logo` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` INTEGER NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `deleteUrl` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Logo_businessId_key`(`businessId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Logo` ADD CONSTRAINT `Logo_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
