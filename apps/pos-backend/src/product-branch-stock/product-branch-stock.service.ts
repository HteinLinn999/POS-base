import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ProductBranchStockService {
  constructor(private prisma: PrismaService) {}

  async getStockByBranch(branchId: string) {
    const stocks = await this.prisma.productBranchStock.findMany({
      where: { branchId: branchId },
      include: {
        product: true,
      },
    });
    return stocks;
  }

  async updateStock(branchId: string, productId: string, quantity: number) {
    const existingStock = await this.prisma.productBranchStock.findFirst({
      where: { branchId: branchId, productId: productId },
    });
    if(!existingStock){
        return await this.prisma.productBranchStock.create({
            data:{
                branchId,
                productId,
                sotck: quantity
            }
        })
    }
  }
}
