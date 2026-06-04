-- CreateTable
CREATE TABLE "attendance_qr" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_qr_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attendance_qr_token_key" ON "attendance_qr"("token");
