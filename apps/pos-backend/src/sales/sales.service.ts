import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async getSalesByBranch(
    branchId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    const sales = await this.prisma.sale.findMany({
      where: {
        branchId: branchId,
        ...dateFilter,
      },
      include: {
        saleItems: {
          include: {
            product: true, 
          },
        },
        cashier: {
          select: { username: true }, 
        },
      },
      orderBy: {
        createdAt: 'desc', 
      },
    });

    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
    const totalOrders = sales.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
      },
      sales,
    };
  }

}
  

