import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async closeShift(data: {
    branchId: string;
    cashierId: string;
    openingCash: number;
    actualCash: number;
  }) {
    let { branchId, cashierId, openingCash, actualCash } = data;

    // ၁။ ပေးလာသော cashierId သည် DB ထဲတွင် ရှိမရှိ စစ်ဆေးခြင်း (မရှိပါက ပထမဆုံး User ကို Fallback ယူရန်)
    const cashierExists = await this.prisma.user.findUnique({
      where: { id: cashierId },
    });

    console.log('Inside ReportsService  cashierExists :', cashierExists);

    if (!cashierExists) {
      const firstUser = await this.prisma.user.findFirst();

      console.log('Inside ReportsService  firstUser:', firstUser);

      if (!firstUser) {
        throw new BadRequestException(
          'Database ထဲတွင် ဝန်ထမ်း (User) တစ်ဦးမှ မရှိသေးပါ။ ကျေးဇူးပြု၍ User အရင်ဖန်တီးပါ။',
        );
      }
      cashierId = firstUser.id; // DB ထဲတွင် တကယ်ရှိသော ID သို့ ပြောင်းပေးခြင်း
    }

    // ၂။ ပေးလာသော branchId သည် DB ထဲတွင် ရှိမရှိ စစ်ဆေးခြင်း
    const branchExists = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });

    console.log('Inside ReportsService  branchExists :', branchExists);
    if (!branchExists) {
      const firstBranch = await this.prisma.branch.findFirst();

      console.log('Inside ReportsService  firstBranch:', firstBranch);
      if (!firstBranch) {
        throw new BadRequestException(
          'Database ထဲတွင် ဆိုင်ခွဲ (Branch) တစ်ခုမှ မရှိသေးပါ။ ကျေးဇူးပြု၍ Branch အရင်ဖန်တီးပါ။',
        );
      }
      branchId = firstBranch.id; // DB ထဲတွင် တကယ်ရှိသော Branch ID သို့ ပြောင်းပေးခြင်း
    }

    // ၃။ ထို branchId နှင့် cashierId ဖြင့် အရောင်းစာရင်းများကို တွက်ချက်ခြင်း
    const sales = await this.prisma.sale.findMany({
      where: {
        branchId,
        cashierId,
      },
    });

    const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const cashSales = sales
      .filter((s) => s.paymentMethod === 'CASH')
      .reduce((sum, s) => sum + s.totalAmount, 0);

    const transferSales = sales
      .filter((s) => s.paymentMethod !== 'CASH')
      .reduce((sum, s) => sum + s.totalAmount, 0);

    const expectedCash = openingCash + cashSales;
    const difference = actualCash - expectedCash; // ပိုငွေ (+) / လိုငွေ (-)

    // ၄။ ShiftReport ဇယားတွင် တရားဝင် မှတ်တမ်းတင်ခြင်း
    const shiftReport = await this.prisma.shiftReport.create({
      data: {
        branchId,
        cashierId,
        openingCash,
        expectedCash,
        actualCash,
        difference,
        totalSales,
        cashSales,
        transferSales,
        status: 'CLOSED',
      },
    });

    return {
      success: true,
      message: 'Shift ပိတ်သိမ်းခြင်းနှင့် Z-Report ထုတ်ယူခြင်း အောင်မြင်ပါပြီ',
      data: shiftReport,
    };
  }
}
