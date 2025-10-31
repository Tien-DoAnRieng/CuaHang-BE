import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { Product } from '../../shared/schemas/entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';

@ApiTags('Product')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo sản phẩm mới' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({ status: 201, description: 'Tạo mới sản phẩm thành công.' })
  create(@Body() data: CreateProductDto) {
    return this.productService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm' })
  @ApiResponse({ status: 200, description: 'Danh sách sản phẩm.' })
  findAll(@Query() query: any) {
    return this.productService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết sản phẩm' })
  @ApiResponse({ status: 200, description: 'Chi tiết sản phẩm.' })
  @ApiParam({ name: 'id', required: true })
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật sản phẩm' })
  @ApiResponse({ status: 200, description: 'Cập nhật sản phẩm thành công.' })
  @ApiParam({ name: 'id', required: true })
  @ApiBody({ type: Object })
  update(@Param('id') id: string, @Body() data: Partial<Product>) {
    return this.productService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa sản phẩm' })
  @ApiResponse({ status: 200, description: 'Xóa sản phẩm thành công.' })
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
