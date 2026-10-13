/*
  Warnings:

  - A unique constraint covering the columns `[invoiceNo]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `branchId` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `invoiceNo` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "StockTransactionType" ADD VALUE 'ADDING';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "branchId" TEXT NOT NULL,
ADD COLUMN     "invoiceNo" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductBranchStock" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "ProductBranchStock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Branch_name_key" ON "Branch"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_code_key" ON "Branch"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductBranchStock_productId_branchId_key" ON "ProductBranchStock"("productId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_invoiceNo_key" ON "Order"("invoiceNo");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBranchStock" ADD CONSTRAINT "ProductBranchStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBranchStock" ADD CONSTRAINT "ProductBranchStock_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
