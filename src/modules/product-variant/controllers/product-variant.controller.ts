
import { Controller, Get, Post, Body, Param, Delete, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariant } from '../../../shared/schemas/entities/product-variant.entity';
import { CreateProductVariantDto } from '../dto/create-product-variant.dto';
import { UpdateProductVariantDto } from '../dto/update-product-variant.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { RoleEnum } from '../../../common/enums/role.enum';
import { Product } from '../../../shared/schemas/entities/product.entity';
import { Category } from '../../../shared/schemas/entities/category.entity';
import { FlashSaleItem } from '../../../shared/schemas/entities/flash-sale-item.entity';
import { ProductService } from '../../product/services/product.service';
@ApiTags('ProductVariant')
@ApiBearerAuth('access-token')
@Controller('product-variants')
export class ProductVariantController {
  constructor(

    private readonly productService: ProductService,
    @InjectRepository(ProductVariant)
      @InjectRepository(Product) private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant) private variantRepository: Repository<ProductVariant>,
    @InjectRepository(Category) private categoryRepository: Repository<Category>,
    @InjectRepository(FlashSaleItem) private flashSaleItemRepository: Repository<FlashSaleItem>,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Tạo biến thể sản phẩm mới' })
  @ApiBody({ type: CreateProductVariantDto })
  @ApiResponse({ status: 201, description: 'Tạo mới biến thể sản phẩm thành công.' })
  async create(@Body() dto: CreateProductVariantDto) {
    const variant = this.variantRepository.create(dto);
    return this.variantRepository.save(variant);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách biến thể sản phẩm' })
  @ApiResponse({ status: 200, description: 'Danh sách biến thể sản phẩm.' })
  async findAll(@Query() query: any) {
    return this.variantRepository.find({ where: query });
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết biến thể sản phẩm' })
  @ApiResponse({ status: 200, description: 'Chi tiết biến thể sản phẩm.' })
  @ApiParam({ name: 'id', required: true, description: 'ID của biến thể' })
  async findOne(@Param('id') id: string) {
    return this.variantRepository.findOne({ where: { id } });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật biến thể sản phẩm' })
  @ApiResponse({ status: 200, description: 'Cập nhật biến thể sản phẩm thành công.' })
  @ApiParam({ name: 'id', required: true, description: 'ID của biến thể cần cập nhật' })
  @ApiBody({ type: UpdateProductVariantDto })
  async update(@Param('id') id: string, @Body() dto: UpdateProductVariantDto) {
    await this.variantRepository.update(id, dto);
    return this.variantRepository.findOne({ where: { id } });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa biến thể sản phẩm' })
  @ApiResponse({ status: 200, description: 'Xóa biến thể sản phẩm thành công.' })
  @ApiParam({ name: 'id', required: true, description: 'ID của biến thể cần xóa' })
  async remove(@Param('id') id: string) {
    return this.variantRepository.delete(id);
  }
  // ProductController

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Get('product/:id/stock')
  @ApiOperation({ summary: 'Lấy tổng tồn kho hiện tại của sản phẩm' })
  @ApiResponse({ status: 200, description: 'Tồn kho sản phẩm.' })
  async getStock(@Param('id') id: string) {
    const stock = await this.productService.getStock(id);
    return { productId: id, stock };
  }
@Public()
@Get('product/:productId')
@ApiOperation({ summary: 'Lấy toàn bộ biến thể của 1 sản phẩm' })
async getVariantsByProduct(@Param('productId') productId: string) {
  return this.variantRepository.find({
    where: { productId },
    relations: ['product', 'color', 'size'],
  });
}

}
