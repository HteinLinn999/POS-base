import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { ProductBranchStockService } from './product-branch-stock.service.js';

@Controller('branch-stocks')
export class ProductBranchStockController {
  constructor(private readonly stockService: ProductBranchStockService) {}

  @Get(':branchId')
  async getStocksByBranch(@Param('branchId') branchId: string) {
    console.log('branchId : ', branchId);
    if (!branchId || branchId === 'undefined' || branchId === 'null') {
      throw new BadRequestException('ဆိုင်ခွဲ ID (branchId) လိုအပ်ပါသည်။');
    }

    return this.stockService.getStockByBranch(branchId);
  }

  @Get('history/audit')
  async getStockHistories() {
    return this.stockService.getStockHistories();
  }

  @Post('update')
  async updateStock(
    @Body() body: { branchId: string; productId: string; quantity: number },
  ) {
    return this.stockService.updateStock(
      body.branchId,
      body.productId,
      body.quantity,
    );
  }

  @Post('transfer')
  async transferStock(
    @Body()
    body: {
      fromBranchId: string;
      toBranchId: string;
      productId: string;
      quantity: number;
    },
  ) {
    return await this.stockService.transferStock(body);
  }

  @Post('adjust')
  async adjustStock(
    @Body()
    body: {
      branchId: string;
      productId: string;
      quantity: number;
      transactionType: 'ADJUSTMENT' | 'STOCK_OUT';
      reason: string;
    },
  ) {
    return this.stockService.adjustStock(body);
  }

  @Post('bulk-stock-in')
  async bulkStockIn(
    @Body()
    body: {
      branchId: string;
      referenceNo: string;
      supplierName?: string;
      items: { productId: string; quantity: number; costPrice?: number }[];
    },
  ) {
    console.log({ body });
    return this.stockService.bulkStockIn(body);
  }
}
