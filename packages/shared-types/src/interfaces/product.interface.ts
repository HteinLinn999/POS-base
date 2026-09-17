import { SaleType } from '../enums/sale-type.enum.js';

export interface IProduct {
  id: string;
  name: string;
  barcode: string;       // Barcode scanner အတွက် အဓိက Field
  sku: string;
  price: number;
  cost: number;          // အမြတ်တွက်ရန် ရင်းနှီးစရိတ်
  stockQuantity: number;
  saleType: SaleType;
  unitOfMeasurement: string; // Pcs, Kg, Gram, Pack
  isAlcohol: boolean;
  expiryDate?: Date;
  categoryId: string;
}
