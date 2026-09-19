import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsDateString,
  Min,
} from 'class-validator';
import { SaleType } from '@pos/shared-types';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'ကုန်ပစ္စည်းအမည် မဖြစ်မနေ ထည့်သွင်းရပါမည်' })
  name: string;

  @IsString()
  @IsNotEmpty({
    message: 'City Mart စနစ်အတွက် Barcode မဖြစ်မနေ ထည့်သွင်းရပါမည်',
  })
  barcode: string; // Barcode Scanner အတွက် မပါမဖြစ် Field ⭐

  @IsString()
  @IsNotEmpty({ message: 'SKU ကုဒ် မဖြစ်မနေ ထည့်သွင်းရပါမည်' })
  sku: string;

  @IsNumber()
  @Min(0, { message: 'ရောင်းဈေးသည် ၀ ထက်မနည်းရပါ' })
  price: number;

  @IsNumber()
  @Min(0, { message: 'ရင်းဈေးသည် ၀ ထက်မနည်းရပါ' })
  cost: number;

  @IsNumber()
  @Min(0, { message: 'လက်ကျန်အရေအတွက်သည် ၀ ထက်မနည်းရပါ' })
  stockQuantity: number;

  @IsEnum(SaleType, {
    message: 'ရောင်းချသည့်ပုံစံသည် UNIT သို့မဟုတ် WEIGHT သာ ဖြစ်ရပါမည်',
  })
  saleType: SaleType;

  @IsString()
  @IsNotEmpty({ message: 'တိုင်းတာသည့်ယူနစ် (ဥပမာ - Kg, Pcs) ထည့်သွင်းရပါမည်' })
  unitOfMeasurement: string;

  @IsBoolean()
  @IsOptional()
  isAlcohol?: boolean;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsString()
  @IsNotEmpty({ message: 'Category ID မဖြစ်မနေ ပါဝင်ရပါမည်' })
  categoryId: string;
}
