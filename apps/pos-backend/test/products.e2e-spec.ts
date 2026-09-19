import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { SaleType } from '@pos/shared-types';

describe('Product Barcode API (Integration/E2E Test)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // တကယ့်လုပ်ငန်းခွင်အတိုင်း class-validator အလုပ်လုပ်စေရန် Global Pipe သတ်မှတ်ခြင်း
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  it('POST /products -> ဥပဒေအမှန်အတိုင်း Barcode ပါက Database ထဲသို့ သိမ်းဆည်းနိုင်ရမည်', async () => {
    const mockProductPayload = {
      name: 'Lay Potato Chips XLarge',
      barcode: '8850123456789', // စက်ပြင် Barcode အမှန်
      sku: 'LAY-XL-001',
      price: 3500,
      cost: 2800,
      stockQuantity: 100,
      saleType: SaleType.UNIT,
      unitOfMeasurement: 'Pcs',
      categoryId: '9f074d0e-953e-4b40-9a3d-425886616238', // စမ်းသပ်မည့် Category UUID
    };

    const response = await request(app.getHttpServer())
      .post('/products')
      .send(mockProductPayload);

    // မျှော်လင့်ချက် - HTTP 201 Created ပြန်လာရမည်
    expect(response.status).toBe(201);
    expect(response.body.barcode).toBe('8850123456789');
    expect(response.body.id).toBeDefined(); // Database မှ generated UUID ပါလာရမည်
  });

  it('POST /products -> Barcode မပါဝင်ပါက HTTP 400 Bad Request ပြန်လည်တုံ့ပြန်ရမည်', async () => {
    const invalidPayload = {
      name: 'Lay Potato Chips',
      barcode: '', // အမှား (ကွက်လပ်)
      sku: 'LAY-002',
      price: 2500,
      cost: 2000,
      stockQuantity: 10,
      saleType: SaleType.UNIT,
      unitOfMeasurement: 'Pcs',
      categoryId: '9f074d0e-953e-4b40-9a3d-425886616238',
    };

    const response = await request(app.getHttpServer())
      .post('/products')
      .send(invalidPayload);

    // မျှော်လင့်ချက် - Validation Fail ၍ HTTP 400 တက်ရမည်
    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      'City Mart စနစ်အတွက် Barcode မဖြစ်မနေ ထည့်သွင်းရပါမည်',
    );
  });

  afterAll(async () => {
    await app.close();
  });
});
