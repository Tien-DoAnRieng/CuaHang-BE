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
import { SizeService } from '../services/size.service';
import { CreateSizeDto } from '../dto/create-size.dto';
import { UpdateSizeDto } from '../dto/update-size.dto';

@Controller('sizes')
export class SizeController {
  constructor(private readonly sizeService: SizeService) {}

  @Post()
  @ApiTags('Size')
  @ApiOperation({ summary: 'Tạo size' })
  @ApiBody({ type: CreateSizeDto })
  @ApiResponse({ status: 201, description: 'Tạo size thành công.' })
  create(@Body() createSizeDto: CreateSizeDto) {
    return this.sizeService.create(createSizeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách size' })
  @ApiResponse({ status: 200, description: 'Danh sách size.' })
  findAll() {
    return this.sizeService.findAll();
  }

  @Get(':id')
  @ApiParam({ name: 'id', required: true })
  @ApiOperation({ summary: 'Lấy chi tiết size theo id' })
  @ApiResponse({ status: 200, description: 'Chi tiết size.' })
  findOne(@Param('id') id: string) {
    return this.sizeService.findOne(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', required: true })
  @ApiBody({ type: UpdateSizeDto })
  @ApiOperation({ summary: 'Cập nhật size' })
  @ApiResponse({ status: 200, description: 'Cập nhật size thành công.' })
  update(@Param('id') id: string, @Body() updateSizeDto: UpdateSizeDto) {
    return this.sizeService.update(id, updateSizeDto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', required: true })
  @ApiOperation({ summary: 'Xóa size' })
  @ApiResponse({ status: 200, description: 'Xóa size thành công.' })
  remove(@Param('id') id: string) {
    return this.sizeService.remove(id);
  }
}