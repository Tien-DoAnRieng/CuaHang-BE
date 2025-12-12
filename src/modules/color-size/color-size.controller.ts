import { Controller, Post, Get, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ColorSizeService } from './color-size.service';
import { AddSizesToColorDto } from './dto/create-multi-size.dto';

@ApiTags('Color-Size')
@Controller('colors-size')
export class ColorSizeController {
  constructor(private readonly service: ColorSizeService) {}

  @Post(':id/sizes')
  @ApiOperation({ summary: 'Gắn nhiều size cho 1 màu' })
  addSizes(
    @Param('id') colorId: string,
    @Body() dto: AddSizesToColorDto,
  ) {
    dto.colorId = colorId;
    return this.service.addSizesToColor(dto);
  }

  @Get(':id/sizes')
  @ApiOperation({ summary: 'Lấy danh sách size của 1 màu' })
  findSizes(@Param('id') colorId: string) {
    return this.service.getColorSizes(colorId);
  }

  @Delete(':id/sizes/:sizeId')
  @ApiOperation({ summary: 'Gỡ 1 size khỏi màu' })
  removeSize(
    @Param('id') colorId: string,
    @Param('sizeId') sizeId: string,
  ) {
    return this.service.removeSize(colorId, sizeId);
  }
}
