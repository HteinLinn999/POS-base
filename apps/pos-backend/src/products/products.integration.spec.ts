import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ProductsService } from './products.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SaleType } from '@pos/shared-types';
import { CreateProductDto } from './dto/create-product.dto.js';

describe('ProductsService <-> Prisma DB (Integration Test)', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsService, PrismaService],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should successfully persist a product with barcode directly to PostgreSQL via Prisma', async () => {
    // စမ်းသပ်ရန်အတွက် Category တစ်ခု အရင်ဆောက်ခြင်း
    const testCategory = await prisma.category.upsert({
      where: { name: 'Test Groceries' },
      update: {},
      create: { name: 'Test Groceries' },
    });

    const mockProductData = {
      name: 'City Mart Premium Bread',
      barcode: '8850987654321', // စက်ပြင် Barcode အမှန်
      sku: 'CM-BREAD-01',
      price: 2800,
      cost: 2200,
      stockQuantity: 40,
      saleType: SaleType.UNIT,
      unitOfMeasurement: 'Pcs',
      categoryId: testCategory.id,
    } as CreateProductDto;

    // 🔴 လက်ရှိတွင် ProductsService မရှိသေးသဖြင့် ဤနေရာတွင် Call လုပ်လျှင် သေချာပေါက် FAIL ဖြစ်ပါမည်
    const savedProduct = await service.createProduct(mockProductData);

    // Database ထဲ ရောက်သွားသော ဒေတာသည် တိကျမှု ရှိမရှိ စစ်ဆေးခြင်း
    expect(savedProduct.id).toBeDefined();
    expect(savedProduct.barcode).toBe('8850987654321');

    // Clean up: စမ်းသပ်ပြီးလျှင် ဒေတာဘေ့စ်ကို ပြန်ရှင်းရန်
    await prisma.product.delete({ where: { id: savedProduct.id } });
  });
});
