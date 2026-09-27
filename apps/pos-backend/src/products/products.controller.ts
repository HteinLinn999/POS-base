import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  Get,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.createProduct(createProductDto);
  }

  @Get('barcode/:barcode')
  async findByBarcode(@Param('barcode') barcode: string) {
    const product = await this.productsService.findByBarcode(barcode);
    // Service ကိုယ်တိုင် NotFoundException throw လုပ်တာကြောင့်
    // Controller မှာ try/catch မလိုအပ်တော့ဘူး
    // if (!product) {
    //   throw new NotFoundException(
    //     `Barcode "${barcode}" ဖြင့် ကုန်ပစ္စည်း ရှာမတွေ့ပါ`,
    //   );
    // }
    return product;
  }
}
