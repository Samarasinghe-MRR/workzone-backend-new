-- AlterTable
ALTER TABLE "AdminProfile" ADD COLUMN     "permissions" TEXT[] DEFAULT ARRAY['READ_USERS', 'DELETE_USERS', 'MANAGE_ROLES']::TEXT[];

-- AlterTable
ALTER TABLE "CustomerProfile" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "ServiceProviderProfile" ADD COLUMN     "hourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[];
