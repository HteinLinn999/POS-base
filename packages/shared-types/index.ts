// export enum SaleType {
//   UNIT = 'UNIT',
//   WEIGHT = 'WEIGHT'
// }

// export interface ICreateProductDto {
//   name: string;
//   barcode: string; // Barcode Scanner အတွက် မပါမဖြစ် Field
//   sku: string;
//   price: number;
//   cost: number;
//   stockQuantity: number;
//   saleType: SaleType;
//   unitOfMeasurement: string; // Pcs, Kg
//   categoryId: string;
// }

// ရာထူးအလိုက် ခွဲခြားရန် User Roles
export enum UserRole {
  ADMIN = 'ADMIN',
  CASHIER = 'CASHIER'
}

// ကုန်ပစ္စည်း ရောင်းချသည့်ပုံစံ
export enum SaleType {
  UNIT = 'UNIT',     // မုန့်၊ အချိုရည် (အရေအတွက်)
  WEIGHT = 'WEIGHT'  // အသား၊ ငါး၊ ဟင်းသီးဟင်းရွက် (အလေးချိန်)
}

// City Mart Product Interface
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
