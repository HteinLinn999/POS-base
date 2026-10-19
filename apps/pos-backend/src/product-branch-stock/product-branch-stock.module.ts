import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ProductBranchStockController } from './product-branch-stock.controller.js';
import { ProductBranchStockService } from './product-branch-stock.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [ProductBranchStockController],
  providers: [ProductBranchStockService],
})
export class ProductBranchStockModule {}
