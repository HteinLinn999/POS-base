/*
  Warnings:

  - You are about to drop the column `userId` on the `Sale` table. All the data in the column will be lost.
  - You are about to alter the column `totalAmount` on the `Sale` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to drop the column `price` on the `SaleItem` table. All the data in the column will be lost.
  - You are about to alter the column `quantity` on the `StockHistory` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - A unique constraint covering the columns `[invoiceNo]` on the table `Sale` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cashReceived` to the `Sale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cashierId` to the `Sale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `changeGiven` to the `Sale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `invoiceNo` to the `Sale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitPrice` to the `SaleItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_orderId_fkey";

-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_userId_fkey";

-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "userId",
ADD COLUMN     "cashReceived" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "cashierId" TEXT NOT NULL,
ADD COLUMN     "changeGiven" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "invoiceNo" TEXT NOT NULL,
ADD COLUMN     "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
ALTER COLUMN "totalAmount" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "SaleItem" DROP COLUMN "price",
ADD COLUMN     "unitPrice" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "StockHistory" ALTER COLUMN "quantity" SET DATA TYPE INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Sale_invoiceNo_key" ON "Sale"("invoiceNo");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
