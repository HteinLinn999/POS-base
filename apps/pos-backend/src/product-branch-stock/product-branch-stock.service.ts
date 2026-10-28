import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ProductBranchStockService {
  constructor(private prisma: PrismaService) {}

  async getStockByBranch(branchId: string) {
    if (!branchId) {
      throw new BadRequestException('branchId is missing');
    }

    const products = await this.prisma.product.findMany();

    for (const product of products) {
      await this.prisma.productBranchStock.upsert({
        where: {
          productId_branchId: {
            productId: product.id,
            branchId: branchId,
          },
        },
        update: {},
        create: {
          productId: product.id,
          branchId: branchId,
          quantity: 0,
        },
      });
    }

    const stocks = await this.prisma.productBranchStock.findMany({
      where: { branchId: branchId },
      include: {
        product: true,
      },
      orderBy: {
        product: { name: 'asc' },
      },
    });
    return stocks;
  }

  async updateStock(branchId: string, productId: string, quantity: number) {
    const existingStock = await this.prisma.productBranchStock.findFirst({
      where: { branchId: branchId, productId: productId },
    });
    if (!existingStock) {
      return await this.prisma.productBranchStock.create({
        data: {
          branchId,
          productId,
          quantity: quantity,
        },
      });
    }

    return await this.prisma.productBranchStock.update({
      where: { id: existingStock.id },
      data: { quantity: quantity },
    });
  }

  async transferStock(data: {
    fromBranchId: string;
    toBranchId: string;
    productId: string;
    quantity: number;
  }) {
    const { fromBranchId, toBranchId, productId, quantity } = data;
    if (quantity <= 0) {
      throw new BadRequestException(
        'လွှဲပြောင်းမည့် အရေအတွက်သည် 0 ထက်ကြီးရပါမည်',
      );
    }
    if (fromBranchId === toBranchId) {
      throw new BadRequestException('တူညီသော ဆိုင်ခွဲသို့ လွှဲပြောင်း၍ မရပါ');
    }

    return await this.prisma.$transaction(async (tx) => {
      const sourceStock = await tx.productBranchStock.findFirst({
        where: { branchId: fromBranchId, productId: productId },
      });

      //check if the stock is sufficint in root/source/main  branch
      if (!sourceStock || sourceStock.quantity < quantity) {
        throw new BadRequestException(
          'လွှဲပြောင်းမည့်ဆိုင်ခွဲတွင် ကုန်ပစ္စည်းလက်ကျန် မလုံလောက်ပါ',
        );
      }

      //decrease stock from root/source/main branch
      await tx.productBranchStock.update({
        where: { id: sourceStock.id },
        data: { quantity: { decrement: quantity } },
      });

      //increase stock to destination branch
      const targetStock = await tx.productBranchStock.findFirst({
        where: { branchId: toBranchId, productId: productId },
      });


        if (!targetStock) {
        await tx.productBranchStock.create({
          data: { branchId: toBranchId, productId, quantity },
        });
      } else {
        await tx.productBranchStock.update({
          where: { id: targetStock.id },
          data: { quantity: { increment: quantity } },
        });
      }
      return { success: true, message: 'ပစ္စည်းလွှဲပြောင်းမှု အောင်မြင်ပါသည်' };
    });
  }
}
