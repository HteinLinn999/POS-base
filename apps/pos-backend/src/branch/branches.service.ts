import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    // 🛡️ ပထမဆုံး Branch လုံးဝမရှိသေးပါက အလိုအလျောက် HQ တစ်ခု ဆောက်ပေးခြင်း (Auto-seed)
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
    console.log('branch service');
  }
}
