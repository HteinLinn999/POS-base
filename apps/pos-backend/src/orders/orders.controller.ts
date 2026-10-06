import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  Get,
} from '@nestjs/common';
import { OrderService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  async findAll() {
    return this.orderService.getAllOrders();
  }

  @Post('checkout')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async checkout(@Body() CreateOrderDto: CreateOrderDto) {
    return this.orderService.checkoutOrder(CreateOrderDto);
  }
}
