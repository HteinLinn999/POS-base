import { describe, it, expect } from 'vitest';
import { SaleType } from '@pos/shared-types';

function validateProductBarcode(product: any): boolean {

  return true;
}

describe('City Mart Product Barcode Validation (TDD Unit Test)', () => {
  it('should strictly throw an error if barcode is empty', () => {
    const invalidProduct = {
      name: 'Lay Potato Chips',
      barcode: '', 
      saleType: SaleType.UNIT,
    };

    expect(() => {
      const isValid = validateProductBarcode(invalidProduct);
      if (isValid) {
        throw new Error('Validation passed but it should have failed!');
      }
    }).toThrow('City Mart စနစ်အတွက် Barcode မဖြစ်မနေ ထည့်သွင်းရပါမည်');
  });
});
