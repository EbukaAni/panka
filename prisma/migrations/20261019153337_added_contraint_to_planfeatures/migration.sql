/*
  Warnings:

  - You are about to drop the `sessions` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[planId,featureId]` on the table `PlanFeatures` will be added. If there are existing duplicate values, this will fail.

*/
-- DropTable
DROP TABLE `sessions`;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `sid` VARCHAR(128) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `data` MEDIUMTEXT NULL,

    UNIQUE INDEX `Session_sid_key`(`sid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `PlanFeatures_planId_featureId_key` ON `PlanFeatures`(`planId`, `featureId`);
