import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { ColorService } from '../services/color.service';
import { CreateColorDto } from '../dto/create-color.dto';
import { UpdateColorDto } from '../dto/update-color.dto';

@Controller('colors')
export class ColorController {
  constructor(private readonly colorService: ColorService) {}

  @Post()
  @ApiTags('Color')
  @ApiOperation({ summary: 'Tạo màu' })
  @ApiBody({ type: CreateColorDto })
  @ApiResponse({ status: 201, description: 'Tạo màu thành công.' })
  create(@Body() createColorDto: CreateColorDto) {
    return this.colorService.create(createColorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách màu' })
  @ApiResponse({ status: 200, description: 'Danh sách màu.' })
  findAll() {
    return this.colorService.findAll();
  }

  @Get(':id')
  @ApiParam({ name: 'id', required: true })
  @ApiOperation({ summary: 'Lấy chi tiết màu theo id' })
  @ApiResponse({ status: 200, description: 'Chi tiết màu.' })
  findOne(@Param('id') id: string) {
    return this.colorService.findOne(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', required: true })
  @ApiBody({ type: UpdateColorDto })
  @ApiOperation({ summary: 'Cập nhật màu' })
  @ApiResponse({ status: 200, description: 'Cập nhật màu thành công.' })
  update(@Param('id') id: string, @Body() updateColorDto: UpdateColorDto) {
    return this.colorService.update(id, updateColorDto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', required: true })
  @ApiOperation({ summary: 'Xóa màu' })
  @ApiResponse({ status: 200, description: 'Xóa màu thành công.' })
  remove(@Param('id') id: string) {
    return this.colorService.remove(id);
  }
}