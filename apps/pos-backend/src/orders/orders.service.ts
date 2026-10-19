import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async checkoutOrder(dto: CreateOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      // ၁။ Sequence မရှိပါက အရင်ဆောက်ပေးခြင်း
      await tx.$executeRawUnsafe(
        `CREATE SEQUENCE IF NOT EXISTS order_invoice_seq START 1;`,
      );

      // ၂။ nextval အား လှမ်းယူပြီး Array Result အဖြစ် စံနှုန်းမီ သန့်ရှင်းစွာ သိမ်းဆည်းခြင်း
      const seqResult: any = await tx.$queryRawUnsafe(
        `SELECT nextval('order_invoice_seq')::text as next_id;`,
      );

      // 🔗 CORE ENTERPRISE FIX: PostgreSQL ပြန်ပေးလိုက်သော Array ၏ ပထမဦးဆုံး Index [0] မှ next_id အား တိကျစွာ ဆွဲထုတ်ခြင်း 🎯 ⭐
      const rawId = seqResult && seqResult[0] ? seqResult[0].next_id : '1';
      const nextId = Number(rawId) || 1;

      const currentYear = new Date().getFullYear();
      const formattedInvoiceNo = `INV-${currentYear}-${String(nextId).padStart(5, '0')}`;

      // ၃။ ပင်မ အရောင်းဘောက်ချာ (Order) အား အစီအစဉ်နံပါတ်အမှန်ဖြင့် ဒေတာဘေ့စ်ထဲ သိမ်းဆည်းခြင်း
      const order = await tx.order.create({
        data: {
          invoiceNo: formattedInvoiceNo,
          totalAmount: dto.totalAmount,
          cashReceived: dto.cashReceived,
          changeGiven: dto.changeGiven,
          paymentMethod: dto.paymentMethod,
          cashierId: dto.cashierId,
          branchId: dto.branchId,
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

  // apps/pos-backend/src/orders/orders.service.ts ၏ အောက်ခြေဆုံး getAllOrders နေရာဟောင်းတွင် အစားထိုးရန်

  // 📊 🔗 ARCHITECTURE FIX: ဒေတာဘေ့စ်မှ ကျလာသော Float/Decimal ကိန်းဂဏန်းများအား သန့်ရှင်းစွာ Number ပြောင်းလဲထုတ်ပေးခြင်း 🎯 ⭐
  async getAllOrders() {
    const orders = await this.prisma.order.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // JavaScript Engine မှ Frontend နားလည်မည့် သန့်ရှင်းသော JSON Format သို့ ပုံစံလဲလှယ်ပေးခြင်း
    return orders.map((order) => ({
      ...order,
      totalAmount: Number(order.totalAmount),
      cashReceived: Number(order.cashReceived),
      changeGiven: Number(order.changeGiven),
      orderItems: order.orderItems.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        quantity: Number(item.quantity),
      })),
    }));
  }

 async create(createOrderDto: CreateOrderDto) {
  const { totalAmount, cashReceived, changeGiven, paymentMethod, cashierId, customerId, items } = createOrderDto;

  // 🛡️ [Ultimate Fix] Database ထဲတွင် Branch လုံးဝ မရှိသေးပါက အလိုအလျောက် အဓိက Branch တစ်ခု စတင်ဖန်တီးပေးခြင်း (Auto-Seed)
  let branch = await this.prisma.branch.findFirst();

  if (!branch) {
    branch = await this.prisma.branch.create({
      data: {
        code: 'HQ-001',
        name: 'Main Branch (HQ)',
        address: 'Yangon, Myanmar',
      },
    });
  }

  const branchId = branch.id; // 👈 ယခုဆိုလျှင် Database ထဲတွင် အသေအချာ ရှိနေပြီးသား ID အမှန် ဖြစ်ပါသည်
  const earnedPoints = Math.floor(totalAmount / 1000);

  return await this.prisma.$transaction(async (tx) => {
    const currentYear = new Date().getFullYear();
    const lastOrder = await tx.order.findFirst({
      where: { branchId },
      orderBy: { createdAt: 'desc' },
    });

    const nextId = lastOrder ? parseInt(lastOrder.invoiceNo.split('-').pop() || '0') + 1 : 1;
    const formattedInvoiceNo = `INV-${currentYear}-${String(nextId).padStart(5, '0')}`;

    // ၁။ ပင်မ အရောင်းဘောက်ချာ (Order) အား ဒေတာဘေ့စ်ထဲ သိမ်းဆည်းခြင်း
    const order = await tx.order.create({
      data: {
        invoiceNo: formattedInvoiceNo,
        totalAmount,
        cashReceived,
        changeGiven,
        paymentMethod,
        cashierId,
        branchId, // 👈 100% မှန်ကန်သော Branch ID
        customerId: customerId || null,
        orderItems: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: {
        orderItems: true,
        customer: true,
      },
    });

    // ၂။ Customer ပါလာပါက Points ပေါင်းထည့်ပေးခြင်း
    if (customerId) {
      await tx.customer.update({
        where: { id: customerId },
        data: {
          points: { increment: earnedPoints },
          totalSpent: { increment: totalAmount },
        },
      });
    }

    return order;
  });
}
}
