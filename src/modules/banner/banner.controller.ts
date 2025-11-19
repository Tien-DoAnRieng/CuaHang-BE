import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Delete,
} from '@nestjs/common';
import { BannerService } from './banner.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { 
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBody
} from '@nestjs/swagger';

@ApiTags('Banners')
@Controller('banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  // CREATE
  @Post()
  @ApiOperation({
    summary: 'Tạo banner mới',
    description: 'Tạo mới một banner với thông tin đầy đủ.',
  })
  @ApiBody({
    description: 'Dữ liệu tạo banner mới',
    schema: {
      example: {
        title: 'Khuyến mãi 50%',
        description: 'Giảm giá tất cả sản phẩm trong tuần lễ vàng',
        imageUrl: 'https://example.com/banner1.jpg',
        active: true,
        priority: 10,
      },
    },
  })
  create(@Body() dto: CreateBannerDto) {
    return this.bannerService.create(dto);
  }

  // FIND ALL
  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách banner đang active',
    description: 'Chỉ trả về banner active=true',
  })
  findAll() {
    return this.bannerService.findAll();
  }

  // FIND ONE
  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin một banner' })
  @ApiParam({ name: 'id', description: 'ID banner' })
  findOne(@Param('id') id: string) {
    return this.bannerService.findOne(id);
  }

  // UPDATE
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật banner' })
  @ApiParam({ name: 'id', description: 'ID banner cần cập nhật' })
  @ApiBody({
    description: 'Dữ liệu cập nhật banner',
    schema: {
      example: {
        title: 'Cập nhật banner khuyến mãi',
        description: 'Giảm giá lên đến 60%',
        imageUrl: 'https://example.com/banner_update.jpg',
        active: true,
        priority: 9,
      },
    },
  })
  update(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.bannerService.update(id, dto);
  }

  // TOGGLE ACTIVE
  @Patch(':id/toggle')
  @ApiOperation({
    summary: 'Bật / Tắt banner',
    description: 'Tự động đổi active giữa true/false',
  })
  @ApiParam({ name: 'id', description: 'ID banner cần toggle' })
  toggle(@Param('id') id: string) {
    return this.bannerService.toggleActive(id);
  }

  // DELETE
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa banner' })
  @ApiParam({ name: 'id', description: 'ID banner cần xóa' })
  remove(@Param('id') id: string) {
    return this.bannerService.remove(id);
  }
}
