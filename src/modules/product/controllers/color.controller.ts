import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { RoleEnum } from '../../../common/enums/role.enum';
import { ColorService } from '../services/color.service';
import { CreateColorDto } from '../dto/create-color.dto';
import { UpdateColorDto } from '../dto/update-color.dto';

@ApiTags('Color')
@ApiBearerAuth('access-token')
@Controller('colors')
export class ColorController {
  constructor(private readonly colorService: ColorService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Tạo màu' })
  @ApiBody({ type: CreateColorDto })
  @ApiResponse({ status: 201, description: 'Tạo màu thành công.' })
  create(@Body() createColorDto: CreateColorDto) {
    return this.colorService.create(createColorDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách màu' })
  @ApiResponse({ status: 200, description: 'Danh sách màu.' })
  findAll() {
    return this.colorService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiParam({ name: 'id', required: true })
  @ApiOperation({ summary: 'Lấy chi tiết màu theo id' })
  @ApiResponse({ status: 200, description: 'Chi tiết màu.' })
  findOne(@Param('id') id: string) {
    return this.colorService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Patch(':id')
  @ApiParam({ name: 'id', required: true })
  @ApiBody({ type: UpdateColorDto })
  @ApiOperation({ summary: 'Cập nhật màu' })
  @ApiResponse({ status: 200, description: 'Cập nhật màu thành công.' })
  update(@Param('id') id: string, @Body() updateColorDto: UpdateColorDto) {
    return this.colorService.update(id, updateColorDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Delete(':id')
  @ApiParam({ name: 'id', required: true })
  @ApiOperation({ summary: 'Xóa màu' })
  @ApiResponse({ status: 200, description: 'Xóa màu thành công.' })
  remove(@Param('id') id: string) {
    return this.colorService.remove(id);
  }
}