/*
  Warnings:

  - A unique constraint covering the columns `[providerId]` on the table `Plan` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Plan_providerId_key` ON `Plan`(`providerId`);
