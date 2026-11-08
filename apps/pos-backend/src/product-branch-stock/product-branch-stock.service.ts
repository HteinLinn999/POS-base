import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ProductBranchStockService {
  constructor(private prisma: PrismaService) {}

  async getStockByBranch(branchId: string) {
    const branchExists = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branchExists) {
      throw new BadRequestException(
        `ပေးထားသော branchId (${branchId}) မှာ ဒေတာဘေ့စ်ထဲတွင် မရှိပါ။ ဆိုင်ခွဲအသစ် ပြန်ရွေးပေးပါ။`,
      );
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
          quantity: product.stockQuantity,
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

  async adjustStock(data: {
    branchId: string;
    productId: string;
    quantity: number;
    transactionType: 'ADJUSTMENT' | 'STOCK_OUT';
    reason: string;
  }) {
    const { branchId, productId, quantity, transactionType, reason } = data;

    return await this.prisma.$transaction(async (tx) => {
      let branchStock = await tx.productBranchStock.findFirst({
        where: { branchId, productId },
      });
      if (!branchStock) {
        branchStock = await tx.productBranchStock.create({
          data: { branchId, productId, quantity: 0 },
        });
      }
      const newQty = branchStock.quantity + quantity;
      if (newQty < 0) {
        throw new BadRequestException(
          'လက်ကျန်ပမာဏထက် ကျော်လွန်၍ လျှော့ချ၍ မရပါ',
        );
      }

      // ၂။ ProductBranchStock ကို ချိန်ညှိခြင်း
      await tx.productBranchStock.update({
        where: { id: branchStock.id },
        data: { quantity: newQty },
      });

      // ၃။ ပင်မ Product table ၏ stockQuantity ကိုလည်း လိုက်လံ ညှိပေးခြင်း
      await tx.product.update({
        where: { id: productId },
        data: { stockQuantity: { increment: quantity } },
      });

      // ၄. StockHistory ထဲတွင် အသေးစိတ် မှတ်တမ်းတင်ခြင်း (Audit Trail)
      await tx.stockHistory.create({
        data: {
          productId,
          quantity: Math.abs(quantity),
          transactionType: transactionType as any,
          reason: `[Branch: ${branchId}] ${reason}`,
        },
      });

      return {
        success: true,
        message: 'စနစ်အတွင်း Stock စာရင်း ချိန်ညှိမှု အောင်မြင်ပါသည်',
      };
    });
  }
  // 📊 Audit Trail / History အားလုံး ဆွဲထုတ်ရန်
  async getStockHistories() {
    return await this.prisma.stockHistory.findMany({
      include: {
        product: {
          select: { name: true, sku: true, barcode: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // နောက်ဆုံးမှတ်တမ်း ၁၀၀ စောင်
    });
  }

  async bulkStockIn(data: {
    branchId: string;
    referenceNo: string;
    supplierName?: string;
    items: { productId: string; quantity: number; costPrice?: number }[];
  }) {
    const { branchId, referenceNo, supplierName, items } = data;

    const branchExists = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branchExists) {
      throw new BadRequestException(
        `ပေးထားသော branchId (${branchId}) မှာ ဒေတာဘေ့စ်ထဲတွင် မရှိပါ။ ထိပ်ဆုံးဘားမှ ဆိုင်ခွဲကို အသစ်ပြန်ရွေးပေးပါ။`,
      );
    }

    if (!items || items.length === 0) {
      throw new BadRequestException('အဝင်လုပ်မည့် ကုန်ပစ္စည်းစာရင်း မပါရှိပါ');
    }

    return await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        let branchStock = await tx.productBranchStock.findFirst({
          where: { branchId, productId: item.productId },
        });

        if (!branchStock) {
          branchStock = await tx.productBranchStock.create({
            data: { branchId, productId: item.productId, quantity: 0 },
          });
        }

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { increment: item.quantity },
            ...(item.costPrice ? { cost: item.costPrice } : {}),
          },
        });

        await tx.productBranchStock.update({
          where: { id: branchStock.id },
          data: { quantity: branchStock.quantity + item.quantity },
        });

        await tx.stockHistory.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            transactionType: 'STOCK_IN',
            reason: `[PO/Ref: ${referenceNo}] Supplier: ${supplierName || 'General Supplier'}`,
          },
        });
      }
      return {
        success: true,
        message:
          'ကုန်ပစ္စည်းအဝင်စာရင်း အစုလိုက်အပြုံလိုက် ထည့်သွင်းခြင်း ပြီးစီးပါပြီ',
      };
    });
  }
}
