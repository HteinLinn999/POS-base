import { Body, Controller, Get, Post } from '@nestjs/common';
import { ProductBranchStockService } from './product-branch-stock.service.js';

@Controller('branch-stocks')
export class ProductBranchStockController {
  constructor(private readonly stockService: ProductBranchStockService) {}

  @Get(':branchId')
  async getStocksByBranch(branchId: string) {
    return this.stockService.getStockByBranch(branchId);
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
}
