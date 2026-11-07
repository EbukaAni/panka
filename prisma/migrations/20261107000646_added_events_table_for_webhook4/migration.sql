/*
  Warnings:

  - Made the column `providerId` on table `Plan` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Plan` MODIFY `providerId` VARCHAR(191) NOT NULL DEFAULT 'null';
