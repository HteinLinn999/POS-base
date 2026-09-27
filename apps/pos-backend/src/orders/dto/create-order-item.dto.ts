import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';

export class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty({ message: 'Product ID မဖြစ်မနေ ပါဝင်ရပါမည်' })
  productId: string;

  @IsNumber()
  @Min(1, { message: 'ပစ္စည်းအရေအတွက်သည် အနည်းဆုံး ၁ ခု ဖြစ်ရပါမည်' })
  quantity: number;

  @IsNumber()
  @Min(0, { message: 'ယူနစ်ဈေးနှုန်းသည် 0 ထက်မနည်းရပါ' })
  unitPrice: number;

}
