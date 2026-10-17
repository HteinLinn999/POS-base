import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Global() // (သို့ Global သုံးထားပါက အခြားနေရာတိုင်းတွင် အလိုအလျောက် သုံးလို့ရပါသည်)
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // 👈 ဤနေရာတွင် PrismaService အား export ထုတ်ပေးရန် လိုအပ်ပါသည်
})
export class PrismaModule {}