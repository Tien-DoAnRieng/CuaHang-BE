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
import { SizeService } from '../services/size.service';
import { CreateSizeDto } from '../dto/create-size.dto';
import { UpdateSizeDto } from '../dto/update-size.dto';

@ApiTags('Size')
@ApiBearerAuth('access-token')
@Controller('sizes')
export class SizeController {
  constructor(private readonly sizeService: SizeService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Tạo size' })
  @ApiBody({ type: CreateSizeDto })
  @ApiResponse({ status: 201, description: 'Tạo size thành công.' })
  create(@Body() createSizeDto: CreateSizeDto) {
    return this.sizeService.create(createSizeDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách size' })
  @ApiResponse({ status: 200, description: 'Danh sách size.' })
  findAll() {
    return this.sizeService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiParam({ name: 'id', required: true })
  @ApiOperation({ summary: 'Lấy chi tiết size theo id' })
  @ApiResponse({ status: 200, description: 'Chi tiết size.' })
  findOne(@Param('id') id: string) {
    return this.sizeService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Patch(':id')
  @ApiParam({ name: 'id', required: true })
  @ApiBody({ type: UpdateSizeDto })
  @ApiOperation({ summary: 'Cập nhật size' })
  @ApiResponse({ status: 200, description: 'Cập nhật size thành công.' })
  update(@Param('id') id: string, @Body() updateSizeDto: UpdateSizeDto) {
    return this.sizeService.update(id, updateSizeDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Delete(':id')
  @ApiParam({ name: 'id', required: true })
  @ApiOperation({ summary: 'Xóa size' })
  @ApiResponse({ status: 200, description: 'Xóa size thành công.' })
  remove(@Param('id') id: string) {
    return this.sizeService.remove(id);
  }
}