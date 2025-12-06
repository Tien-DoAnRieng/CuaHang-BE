import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Delete,
  Query,
} from '@nestjs/common';
import { BannerService } from './banner.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
@ApiTags('Banners')
@Controller('banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Post()
  @ApiOperation({
    summary: 'Tạo banner mới',
    description: 'Tạo một banner mới với thông tin đầy đủ.',
  })
  @ApiBody({
    schema: {
      example: {
        title: 'Khuyến mãi 50%',
        description: 'Giảm giá tất cả sản phẩm tuần lễ vàng',
        imageUrl: 'https://example.com/banner.jpg',
        active: true,
        priority: 10,
      },
    },
  })
  create(@Body() dto: CreateBannerDto) {
    return this.bannerService.create(dto);
  }
  @Get('active')
  @ApiOperation({ summary: 'Lấy danh sách banner đang bật' })
  findActive() {
    return this.bannerService.findActiveBanners();
  }
  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách banner với tìm kiếm, phân trang, lọc active',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'active', required: false, description: 'true/false' })
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('active') active?: string,
  ) {
    return this.bannerService.findAllWithPagination(
      search,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      active === 'true' ? true : active === 'false' ? false : undefined,
    );
  }
  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin một banner' })
  @ApiParam({ name: 'id', description: 'ID banner' })
  findOne(@Param('id') id: string) {
    return this.bannerService.findOne(id);
  }
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật banner' })
  @ApiParam({ name: 'id', description: 'ID banner cần cập nhật' })
  @ApiBody({
    description: 'Dữ liệu cập nhật banner',
    schema: {
      example: {
        title: 'Banner cập nhật',
        description: 'Giảm giá 60%',
        imageUrl: 'https://example.com/banner_update.jpg',
        active: true,
        priority: 8,
      },
    },
  })
  update(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.bannerService.update(id, dto);
  }
  @Patch(':id/active')
  @ApiOperation({
    summary: 'Bật/tắt banner',
    description: 'Cập nhật trạng thái active (true/false)',
  })
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: { example: { active: true } },
  })
  setActive(@Param('id') id: string, @Body('active') active: boolean) {
    return this.bannerService.setActive(id, active);
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa banner' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string) {
    return this.bannerService.remove(id);
  }
}
