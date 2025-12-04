import { Controller, Get, Post, Put, Delete, Query, Param, Body, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { ProductImportService } from '../services/product-import.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleEnum } from '../../../common/enums/role.enum';
import { Public } from '../../../common/decorators/public.decorator';
import { ProductVariant } from '../../../shared/schemas/entities/product-variant.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
@ApiTags('Product')
@Controller('products')
@ApiBearerAuth('access-token')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly productImportService: ProductImportService,
       @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
  ) {}

  // 🔹 Public API
  @Public()
  @Get()
  @ApiQuery({ name: 'q', required: false, description: 'Từ khóa tìm kiếm (tên, mô tả)' })
  @ApiQuery({ name: 'category', required: false, description: 'Lọc theo category' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm' })
  @ApiResponse({ status: 200, description: 'Danh sách sản phẩm.' })
  findAll(@Query() query: any) {
    return this.productService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiParam({ name: 'id', required: true })
  @ApiOperation({ summary: 'Lấy chi tiết sản phẩm' })
  @ApiResponse({ status: 200, description: 'Chi tiết sản phẩm.' })
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  // 🔹 Admin API
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiBody({ type: CreateProductDto })
  @ApiOperation({ summary: 'Tạo sản phẩm mới (Admin)' })
  @ApiResponse({ status: 201, description: 'Tạo mới sản phẩm thành công.' })
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiParam({ name: 'id', required: true })
  @ApiBody({ type: UpdateProductDto })
  @ApiOperation({ summary: 'Cập nhật sản phẩm (Admin)' })
  @ApiResponse({ status: 200, description: 'Cập nhật sản phẩm thành công.' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiParam({ name: 'id', required: true })
  @ApiOperation({ summary: 'Xóa sản phẩm (Admin)' })
  @ApiResponse({ status: 200, description: 'Xóa sản phẩm thành công.' })
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  @Post('import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Import sản phẩm từ Excel (XLSX/CSV)' })
  async import(@UploadedFile() file: Express.Multer.File) {
    if (!file || !file.buffer) return { error: 'No file uploaded' };
    return this.productImportService.importFromFile(file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Get('admin')
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({ summary: 'Danh sách sản phẩm admin (có phân trang và lọc)' })
  @ApiResponse({ status: 200 })
  findAllAdmin(@Query() query: any) {
    return this.productService.findAll(query);
  }
  
}
