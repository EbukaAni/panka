/*
  Warnings:

  - You are about to drop the column `deleteUrl` on the `Logo` table. All the data in the column will be lost.
  - You are about to drop the column `providerId` on the `Logo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Logo` DROP COLUMN `deleteUrl`,
    DROP COLUMN `providerId`;
