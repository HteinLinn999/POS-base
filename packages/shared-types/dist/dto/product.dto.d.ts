import { SaleType } from '../enums/sale-type.enum.js';
export interface ICreateProductDto {
    name: string;
    barcode: string;
    sku: string;
    price: number;
    cost: number;
    stockQuantity: number;
    saleType: SaleType;
    unitOfMeasurement: string;
    categoryId: string;
}
//# sourceMappingURL=product.dto.d.ts.map