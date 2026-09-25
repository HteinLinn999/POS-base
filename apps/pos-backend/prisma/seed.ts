// import { PrismaClient } from '@prisma/client';
//import { SaleType } from '@pos/shared-types';

import { PrismaClient, SaleType } from '@prisma/client';

import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // ═══════════════════════════════════════════════════════════
  // Step 1: Category များ အရင် ဖန်တီး
  // (Product က categoryId ကို မဖြစ်မနေ လိုအပ်တာကြောင့်)
  // ═══════════════════════════════════════════════════════════
  const beverageCategory = await prisma.category.upsert({
    where: { name: 'အချိုရည်' },
    update: {},
    create: { name: 'အချိုရည်' },
  });

  const meatCategory = await prisma.category.upsert({
    where: { name: 'အသား' },
    update: {},
    create: { name: 'အသား' },
  });

  const snackCategory = await prisma.category.upsert({
    where: { name: 'မုန့်' },
    update: {},
    create: { name: 'မုန့်' },
  });

  // ═══════════════════════════════════════════════════════════
  // Step 2: Products — Required field အားလုံး ထည့်
  // ═══════════════════════════════════════════════════════════

  // ① Coca-Cola (UNIT — အလုံးနဲ့ ရောင်း)
  await prisma.product.upsert({
    where: { barcode: '8850001234567' },
    update: {},
    create: {
      name: 'Coca-Cola 330ml',
      barcode: '8850001234567',
      sku: 'COKE-330', // ✅ Required
      price: 1200,
      cost: 900, // ✅ Required
      stockQuantity: 100,
      saleType: SaleType.UNIT, // ✅ Prisma enum
      unitOfMeasurement: 'Pcs', // ✅ Required
      isAlcohol: false,
      categoryId: beverageCategory.id, // ✅ Required FK
    },
  });

  // ② ကြက်သား (WEIGHT — အလေးချိန်နဲ့ ရောင်း)
  await prisma.product.upsert({
    where: { barcode: '8850009999999' },
    update: {},
    create: {
      name: 'ကြက်သား (အလေးချိန်)',
      barcode: '8850009999999',
      sku: 'CHICKEN-001',
      price: 15000, // 1 Kg ဈေး
      cost: 12000,
      stockQuantity: 50,
      saleType: SaleType.WEIGHT,
      unitOfMeasurement: 'Kg',
      isAlcohol: false,
      categoryId: meatCategory.id,
    },
  });

  // ③ ဘီယာ (Alcohol — isAlcohol true)
  await prisma.product.upsert({
    where: { barcode: '8850007777777' },
    update: {},
    create: {
      name: 'Myanmar Beer 330ml',
      barcode: '8850007777777',
      sku: 'BEER-MY-330',
      price: 1800,
      cost: 1400,
      stockQuantity: 200,
      saleType: SaleType.UNIT,
      unitOfMeasurement: 'Pcs',
      isAlcohol: true, // ✅ alcohol
      categoryId: beverageCategory.id,
    },
  });

  // ④ မုန့် (expiryDate ပါ)
  await prisma.product.upsert({
    where: { barcode: '8850005555555' },
    update: {},
    create: {
      name: "Lay's Chips 50g",
      barcode: '8850005555555',
      sku: 'LAYS-50',
      price: 1500,
      cost: 1100,
      stockQuantity: 300,
      saleType: SaleType.UNIT,
      unitOfMeasurement: 'Pack',
      isAlcohol: false,
      expiryDate: new Date('2026-12-31'), // ✅ optional ဒါပေမယ့် ထည့်ပြ
      categoryId: snackCategory.id,
    },
  });

  console.log('✅ Seed ပြီးပါပြီ');
  console.log(`   📦 Categories: 3`);
  console.log(`   🛒 Products: 4`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
