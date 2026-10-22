/*
  Warnings:

  - The primary key for the `Logo` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Logo` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - Added the required column `providerId` to the `Logo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Logo` DROP PRIMARY KEY,
    ADD COLUMN `providerId` VARCHAR(191) NOT NULL,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);
