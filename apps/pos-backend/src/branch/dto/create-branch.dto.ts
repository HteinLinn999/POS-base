import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty()
  name: string; // ဥပမာ - "City Mart - Junction Square"

  @IsString()
  @IsNotEmpty()
  code: string; // ဥပမာ - "BR-YGN-01"

  @IsString()
  @IsOptional()
  address?: string; // ဥပမာ - "Yangon, Myanmar"

  @IsString()
  @IsOptional()
  phone?: string;
}
