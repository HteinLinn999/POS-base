import { Controller, Post, Body } from '@nestjs/common';
import { ReportsService } from './reports.service.js';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('close-shift')
  async closeShift(
    @Body()
    body: {
      branchId: string;
      cashierId: string;
      openingCash: number;
      actualCash: number;
    },
  ) {
    console.log('inside the ReportController :', { body });
    return this.reportsService.closeShift(body);
  }
}
