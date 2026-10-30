import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { SalesService } from './sales.service.js';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get('/branch/:branchId')
  async getSalesByBranch(
    @Param('branchId') branchId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!branchId || branchId === 'undefined' || branchId === 'null') {
      throw new BadRequestException('ဆိုင်ခွဲ ID (branchId) လိုအပ်ပါသည်။');
    }
    return await this.salesService.getSalesByBranch(
      branchId,
      startDate,
      endDate,
    );
  }
}
