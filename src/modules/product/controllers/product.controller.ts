import { Controller, Get, Post, Put, Delete, Query, Param, Body, UseGuards, UploadedFile, UseInterceptors, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { ProductImportService } from '../services/product-import.service';
import { ProductAnalyticsService } from '../services/product-analytics.service';
import { Product } from '../../../shared/schemas/entities/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { OwnershipGuard } from '../../../common/guards/ownership.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Ownership } from '../../../common/decorators/ownership.decorator';
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
    private readonly productAnalyticsService: ProductAnalyticsService,

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @Get('admin')
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({ summary: 'Admin/Seller: Danh sách sản phẩm (Cả Admin và Seller đều thấy tất cả sản phẩm)' })
  @ApiResponse({ status: 200 })
  findAllAdmin(@Req() req: any, @Query() query: any) {
    const user = req.user;
    
    // Extract roles - hỗ trợ nhiều format
    let userRoles: string[] = [];
    if (Array.isArray(user?.roles)) {
      userRoles = user.roles.map((r: any) => (typeof r === 'string' ? r : (r.name || r)));
    } else if (user?.role) {
      const roleName = typeof user.role === 'string' ? user.role : (user.role.name || user.role);
      userRoles = [roleName];
    } else if (user?.roleName) {
      userRoles = [user.roleName];
    }
    
    // Normalize role names to lowercase for comparison
    const normalizedRoles = userRoles.map(r => r.toLowerCase());
    const isSeller = normalizedRoles.includes(RoleEnum.SELLER.toLowerCase()) || normalizedRoles.includes('seller');
    const isAdmin = normalizedRoles.includes(RoleEnum.ADMIN.toLowerCase()) || normalizedRoles.includes('admin') || normalizedRoles.includes('administrator');
    
    // Cả Admin và Seller đều thấy tất cả sản phẩm (không filter theo sellerId)
    const sellerId = undefined; // Không filter, cho cả admin và seller thấy tất cả
    
    // Debug logging
    console.log('[ProductController.findAllAdmin] Debug:', {
      userId: user?.id,
      userEmail: user?.email,
      userRoles,
      normalizedRoles,
      isSeller,
      isAdmin,
      sellerId: 'undefined (showing all products)',
      queryParams: query
    });
    
    return this.productService.findAll({ ...query, sellerId });
  }

  // Debug endpoint để kiểm tra seller info và products
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @Get('admin/debug')
  @ApiOperation({ summary: 'Debug: Kiểm tra thông tin seller và sản phẩm' })
  async debugSellerInfo(@Req() req: any) {
    const user = req.user;
    
    // Extract roles
    let userRoles: string[] = [];
    if (Array.isArray(user?.roles)) {
      userRoles = user.roles.map((r: any) => (typeof r === 'string' ? r : (r.name || r)));
    } else if (user?.role) {
      const roleName = typeof user.role === 'string' ? user.role : (user.role.name || user.role);
      userRoles = [roleName];
    } else if (user?.roleName) {
      userRoles = [user.roleName];
    }
    
    const normalizedRoles = userRoles.map(r => r.toLowerCase());
    const isSeller = normalizedRoles.includes(RoleEnum.SELLER.toLowerCase()) || normalizedRoles.includes('seller');
    const isAdmin = normalizedRoles.includes(RoleEnum.ADMIN.toLowerCase()) || normalizedRoles.includes('admin');
    const sellerId = isSeller && !isAdmin ? user.id : undefined;
    
    // Lấy tất cả sản phẩm của seller (không phân trang)
    let sellerProducts: Product[] = [];
    if (sellerId) {
      const result = await this.productService.findAll({ page: 1, limit: 1000, sellerId });
      sellerProducts = result.data || [];
    }
    
    return {
      user: {
        id: user?.id,
        email: user?.email,
        roles: userRoles,
        normalizedRoles,
        isSeller,
        isAdmin,
        sellerId
      },
      products: {
        count: sellerProducts.length,
        items: sellerProducts.map((p: any) => ({
          id: p.id,
          name: p.name,
          sellerId: p.sellerId
        }))
      }
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.SELLER)
  @Get('seller/my-products')
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({ summary: 'Seller: Danh sách sản phẩm của chính mình' })
  @ApiResponse({ status: 200 })
  findMyProducts(@Req() req: any, @Query() query: any) {
    const sellerId = req.user?.id;
    return this.productService.findAll({ ...query, sellerId });
  }

  @Public()
  @Get(':id')
  @ApiParam({ name: 'id', required: true })
  @ApiOperation({ summary: 'Lấy chi tiết sản phẩm' })
  @ApiResponse({ status: 200, description: 'Chi tiết sản phẩm.' })
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  // 🔹 Admin & Seller API
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @ApiBody({ type: CreateProductDto })
  @ApiOperation({ summary: 'Tạo sản phẩm mới (Admin/Seller)' })
  @ApiResponse({ status: 201, description: 'Tạo mới sản phẩm thành công.' })
  create(@Req() req: any, @Body() dto: CreateProductDto) {
    const user = req.user;
    const userRoles = Array.isArray(user?.roles)
      ? user.roles.map((r: any) => (typeof r === 'string' ? r : r.name))
      : user?.role
      ? [user.role.name || user.role]
      : [];
    
    // Nếu là seller, lưu sellerId; admin có thể tạo sản phẩm không có sellerId
    const sellerId = userRoles.includes(RoleEnum.SELLER) ? user.id : undefined;
    return this.productService.create(dto, sellerId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @ApiParam({ name: 'id', required: true })
  @ApiBody({ type: UpdateProductDto })
  @ApiOperation({ summary: 'Cập nhật sản phẩm (Admin/Seller - cả 2 đều có thể cập nhật tất cả)' })
  @ApiResponse({ status: 200, description: 'Cập nhật sản phẩm thành công.' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @ApiParam({ name: 'id', required: true })
  @ApiOperation({ summary: 'Xóa sản phẩm (Admin/Seller - cả 2 đều có thể xóa tất cả)' })
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

    if (!file || !file.buffer) {
      return { error: 'No file uploaded' };
    }
    const result = await this.productImportService.importFromFile(file);
    return result;
  }

  @Public()
  @Get('top-selling')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Last N days to consider' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm bán chạy (top-selling)' })
  async topSelling(@Query('limit') limit?: number, @Query('days') days?: number, @Query('categoryId') categoryId?: string) {
    const l = limit ? Number(limit) : 10;
    const d = days ? Number(days) : undefined;
    return this.productAnalyticsService.getTopSelling({ limit: l, days: d, categoryId });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @Get('admin/top-selling')
  @ApiBearerAuth('access-token')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'from', required: false, description: 'From date (ISO or DD/MM/YYYY)' })
  @ApiQuery({ name: 'to', required: false, description: 'To date (ISO or DD/MM/YYYY)' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiOperation({ summary: 'Admin/Seller: Lấy top sản phẩm bán chạy (Cả Admin và Seller đều thấy tất cả)' })
  async topSellingAdmin(@Req() req: any, @Query('page') page?: number, @Query('limit') limit?: number, @Query('from') from?: string, @Query('to') to?: string, @Query('categoryId') categoryId?: string) {
    const p = page ? Number(page) : 1;
    const l = limit ? Number(limit) : 20;
    
    // Cả Admin và Seller đều thấy tất cả top sản phẩm (không filter theo sellerId)
    const sellerId = undefined;
    
    return this.productAnalyticsService.getTopSellingAdmin({ page: p, limit: l, from, to, categoryId, sellerId });
  }
@Public()
@Get('with-relations/list')
@ApiOperation({ summary: 'Lấy danh sách sản phẩm kèm biến thể + màu + size + ảnh' })
async findAllWithRelations(@Query() query: any) {
  return this.productService.findAllWithRelations(query);
}

}
