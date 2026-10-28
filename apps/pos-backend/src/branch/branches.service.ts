import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    let count = await this.prisma.branch.count();
    if (count === 0) {
      
      await this.prisma.branch.create({
        data: {
          code: 'HQ-001',
          name: 'Main Branch (HQ)',
          address: 'Yangon, Myanmar',
        },
      });
    }

    return await this.prisma.branch.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(branchDto: CreateBranchDto) {
    const existing = await this.prisma.branch.findUnique({
      where: { code: branchDto.code },
    });
    if (existing) {
      throw new BadRequestException(
        'ဤ ဆိုင်ခွဲ ကုဒ် (Code) ဖြင့် ရှိနှင့်ပြီးသား ဖြစ်ပါသည်',
      );
    }

    return await this.prisma.branch.create({
      data: {
        code: branchDto.code,
        name: branchDto.name,
        address: branchDto.address,
        phone: branchDto.phone,
      },
    });
  }

  async update(id: string, branchDto: Partial<CreateBranchDto>) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
    });

    if (!branch) {
      throw new BadRequestException('ရှာမတွေ့သော ဆိုင်ခွဲ ဖြစ်ပါသည်');
    }

    return await this.prisma.branch.update({
      where: { id },
      data: branchDto,
    });
  }

  async  remove(id:string){

    const branch = await this.prisma.branch.findUnique({
      where:{id}
    });
    

    if (!branch) {
      throw new BadRequestException('ရှာမတွေ့သော ဆိုင်ခွဲ ဖြစ်ပါသည်');
    }
    

    // Main HQ ကို ဖျက်လို့မရအောင် ကာကွယ်ခြင်း (Safety Check)
    if (branch.code === 'HQ-001') {
      throw new BadRequestException('ပင်မ Main Branch (HQ) ကို ဖျက်၍ မရပါ');
    }

    return await this.prisma.branch.delete({
      where: { id },
    });
  }
}
