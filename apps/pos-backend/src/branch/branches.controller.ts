import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { BranchesService } from './branches.service.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';

@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  async findAll() {
    return await this.branchesService.findAll();
  }

  @Post()
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(createBranchDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateBranchDto>,
  ) {
    return await this.branchesService.update(id, updateDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.branchesService.remove(id);
  }
}
