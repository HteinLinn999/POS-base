import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ProductsController } from './products/products.controller.js';
import { ProductsService } from './products/products.service.js';
import { PrismaService } from './prisma/prisma.service.js';
import { OrdersController } from './orders/orders.controller.js';
import { OrderService } from './orders/orders.service.js';

@Module({
  imports: [],
  controllers: [AppController, ProductsController,OrdersController],
  providers: [AppService, ProductsService, PrismaService , OrderService],
})
export class AppModule {}
