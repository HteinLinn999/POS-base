import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProduct(dto: CreateProductDto) {
    // ၁။ Barcode ရှိပြီးသား ဖြစ်နေပါက စစ်ဆေးခြင်း
    const existingProduct = await this.prisma.product.findUnique({
      where: { barcode: dto.barcode },
    });

    if (existingProduct) {
      throw new BadRequestException(
        'ဤ Barcode ဖြင့် ကုန်ပစ္စည်းစာရင်း ရှိနှင့်ပြီးသား ဖြစ်ပါသည်',
      );
    }

    // ၂။ တကယ့် ဒေတာဘေ့စ် Table ထဲသို့ သွားရောက် သိမ်းဆည်းခြင်း
    return this.prisma.product.create({
      data: {
        name: dto.name,
        barcode: dto.barcode,
        sku: dto.sku,
        price: dto.price,
        cost: dto.cost,
        stockQuantity: dto.stockQuantity,
        saleType: dto.saleType,
        unitOfMeasurement: dto.unitOfMeasurement,
        isAlcohol: dto.isAlcohol ?? false,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        categoryId: dto.categoryId,
      },
    });
  }

  // ✅ အသစ် — Barcode နဲ့ ရှာဖွေခြင်း
  async findByBarcode(barcode: string) {
    const product = await this.prisma.product.findUnique({
      where: { barcode },
      // ✅ Frontend လိုအပ်တဲ့ field တွေပဲ ရွေး (response သေးစေဖို့)
      select: {
        id: true,
        name: true,
        barcode: true,
        price: true,
        saleType: true,
        unitOfMeasurement: true,
        stockQuantity: true,
      },
    });

    console.log('product :', product);
    if (!product) {
      // Controller မှာ catch ဖြစ်စေဖို့ NotFoundException ကို ဒီမှာ throw
      throw new NotFoundException(
        `Barcode "${barcode}" ဖြင့် ကုန်ပစ္စည်း ရှာမတွေ့ပါ`,
      );
    }

    // ⚠️ Prisma Decimal → Number (JSON.stringify မှာ string ဖြစ်သွားတာ ကာကွယ်)
    return {
      ...product,
      price: Number(product.price),
    };
  }
}
