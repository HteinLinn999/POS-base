import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async checkoutOrder(dto: CreateOrderDto) {
    // return this.prisma.\$transaction(async (tx) => {
    return this.prisma.$transaction(async (tx) => {
      // ၁။ ပင်မ အရောင်းဘောက်ချာ (Order) အား စတင်သိမ်းဆည်းခြင်း
      const order = await tx.order.create({
        data: {
          totalAmount: dto.totalAmount,
          cashReceived: dto.cashReceived,
          changeGiven: dto.changeGiven,
          paymentMethod: dto.paymentMethod,
          cashierId: dto.cashierId,
        },
      });

      for (const item of dto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!product || product.stockQuantity < item.quantity) {
          throw new BadRequestException(
            `ကုန်ပစ္စည်း: ${product?.name || 'Unknown'} သည် လက်ကျန်မလောက်ပါသဖြင့် ရောင်းချ၍မရပါ`,
          );
        }

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });
        // Inventory စနစ်အတွက် StockHistory Table ထဲတွင် STOCK_OUT အဖြစ် စာရင်းမှတ်တမ်းသွင်းခြင်း
        await tx.stockHistory.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            transactionType: 'STOCK_OUT',
            reason: `အရောင်းဘောက်ချာ ID: ${order.id} ဖြင့် ရောင်းထွက်ခြင်း`,
          },
        });
      }
      return order;
    });
  }
}
