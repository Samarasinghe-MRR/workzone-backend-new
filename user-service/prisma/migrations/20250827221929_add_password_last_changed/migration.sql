/*
  Warnings:

  - You are about to drop the column `permissions` on the `AdminProfile` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `CustomerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `CustomerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `hourlyRate` on the `ServiceProviderProfile` table. All the data in the column will be lost.
  - You are about to drop the column `isVerified` on the `ServiceProviderProfile` table. All the data in the column will be lost.
  - You are about to drop the column `skills` on the `ServiceProviderProfile` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Role` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[authUserId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `authUserId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AdminProfile" DROP COLUMN "permissions";

-- AlterTable
ALTER TABLE "CustomerProfile" DROP COLUMN "latitude",
DROP COLUMN "longitude";

-- AlterTable
ALTER TABLE "ServiceProviderProfile" DROP COLUMN "hourlyRate",
DROP COLUMN "isVerified",
DROP COLUMN "skills";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password",
ADD COLUMN     "authUserId" TEXT NOT NULL,
ADD COLUMN     "passwordLastChanged" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_authUserId_key" ON "User"("authUserId");
