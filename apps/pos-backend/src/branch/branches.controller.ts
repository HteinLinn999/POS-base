import { Controller, Get } from '@nestjs/common';
import { BranchesService } from './branches.service.js';

@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  async findAll() {
    return await this.branchesService.findAll();
  }
}