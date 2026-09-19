import { describe, it, expect } from 'vitest';
import { SaleType } from '@pos/shared-types';
import { CreateProductDto } from './dto/create-product.dto.js';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

async function validateDto(plainObject: Partial<CreateProductDto>) {
  const objectInstance = plainToInstance(CreateProductDto, plainObject);
  const errors = await validate(objectInstance);
  return errors;
}

describe('City Mart Product DTO Validation (TDD Unit Test - Green Phase)', () => {
  it('should catch an error if barcode is empty or missing', async () => {
    const invalidProduct: Partial<CreateProductDto>  = {
      name: 'Lay Potato Chips',
      barcode: '', // ကွက်လပ်ဖြစ်၍ Error တက်ရမည်
      sku: 'LAY-001',
      price: 2500,
      cost: 2000,
      stockQuantity: 50,
      saleType: SaleType.UNIT,
      unitOfMeasurement: 'Pcs',
      categoryId: 'cat-uuid-123',
    };

    const errors = await validateDto(invalidProduct);
    expect(errors.length).toBeGreaterThan(0);

    const barcodeError = errors.find((e) => e.property === 'barcode');
    expect(barcodeError?.constraints?.isNotEmpty).toBe(
      'City Mart စနစ်အတွက် Barcode မဖြစ်မနေ ထည့်သွင်းရပါမည်',
    );
  });

  it('should successfully validate if all product fields are 100% correct', async () => {
    const validProduct: Partial<CreateProductDto>  = {
      name: 'Coca Cola Can',
      barcode: '8850123456789', // Barcode အမှန်ပါဝင်သည်
      sku: 'COKE-001',
      price: 1500,
      cost: 1100,
      stockQuantity: 100,
      saleType: SaleType.UNIT,
      unitOfMeasurement: 'Pcs',
      categoryId: 'cat-uuid-123',
    };

    const errors = await validateDto(validProduct);
    expect(errors.length).toBe(0);
  });
});
