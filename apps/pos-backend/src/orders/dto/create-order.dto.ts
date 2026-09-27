import {
  IsNumber,
  IsNotEmpty,
  IsString,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-item.dto.js';

export class CreateOrderDto {
  @IsNumber()
  @Min(0, { message: 'စုစုပေါင်းကျသင့်ငွေသည် 0  ထက် မနည်းရပါ' })
  totalAmount: number;

  @IsNumber()
  @Min(0, { message: 'ဝယ်သူပေးငွေသည် ၀ ထက်မနည်းရပါ' })
  cashReceived: number;

  @IsNumber()
  @Min(0, { message: 'ပြန်အမ်းငွေသည် ၀ ထက်မနည်းရပါ' })
  changeGiven: number;

  @IsString()
  @IsNotEmpty({ message: 'ငွေပေးချေမှုစနစ် (ဥပမာ - Cash, KPay) မဖြစ်မနေ ပါဝင်ရပါမည်' })
  paymentMethod: string;

  @IsString()
  @IsNotEmpty({ message: 'ဝန်ထမ်း Cashier ID မဖြစ်မနေ ပါဝင်ရပါမည်' })
  cashierId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @IsNotEmpty({ message: 'ခြင်းတောင်းထဲတွင် အနည်းဆုံး ပစ္စည်း ၁ မျိုး ပါဝင်ရပါမည်' })
  items: CreateOrderItemDto[];
}
