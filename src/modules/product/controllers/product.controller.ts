import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { ProductImportService } from '../services/product-import.service';
import { Product } from '../../../shared/schemas/entities/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleEnum } from '../../../common/enums/role.enum';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Product')
@ApiBearerAuth('access-token')
@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly productImportService: ProductImportService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Tạo sản phẩm mới(admin)' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({ status: 201, description: 'Tạo mới sản phẩm thành công.' })
  create(@Body() data: CreateProductDto) {
    return this.productService.create(data);
  }

  @Post('import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Import products from Excel (XLSX/CSV) - admin' })
  async import(@UploadedFile() file: Express.Multer.File) {
    if (!file || !file.buffer) {
      return { error: 'No file uploaded' };
    }
    const result = await this.productImportService.importFromFile(file);
    return result;
  }

  @Public()
  @Get()
  @ApiQuery({ name: 'q', required: false, description: 'Từ khóa tìm kiếm (tên, mô tả)' })
  @ApiQuery({ name: 'page', required: false, description: 'Số trang (pagination)', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Số item trên trang (pagination)', type: Number })
  @ApiQuery({ name: 'category', required: false, description: 'Lọc theo tên category' })
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm' })
  @ApiResponse({ status: 200, description: 'Danh sách sản phẩm.' })
  findAll(@Query() query: any) {
    return this.productService.findAll(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Get('admin')
  @ApiQuery({ name: 'q', required: false, description: 'Từ khóa tìm kiếm (tên, mô tả)' })
  @ApiQuery({ name: 'category', required: false, description: 'Lọc theo tên category' })
  @ApiQuery({ name: 'page', required: false, description: 'Số trang (pagination)', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Số item trên trang (pagination)', type: Number })
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm (admin) - có phân trang và lọc' })
  @ApiResponse({ status: 200, description: 'Danh sách sản phẩm cho admin.' })
  findAllAdmin(@Query() query: any) {
    return this.productService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết sản phẩm' })
  @ApiResponse({ status: 200, description: 'Chi tiết sản phẩm.' })
  @ApiParam({ name: 'id', required: true })
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật sản phẩm(admin)' })
  @ApiResponse({ status: 200, description: 'Cập nhật sản phẩm thành công.' })
  @ApiParam({ name: 'id', required: true })
  @ApiBody({ type: Object })
  update(@Param('id') id: string, @Body() data: Partial<Product>) {
    return this.productService.update(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa sản phẩm(admin)' })
  @ApiResponse({ status: 200, description: 'Xóa sản phẩm thành công.' })
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
