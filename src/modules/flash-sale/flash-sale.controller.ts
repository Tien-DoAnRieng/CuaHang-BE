import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { FlashSaleService } from './flash-sale.service';
import { CreateFlashSaleDto } from './dto/create-flash-sale.dto';
import { UpdateFlashSaleDto } from './dto/update-flash-sale.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleEnum } from '../../common/enums/role.enum';

@ApiTags('Flash Sale')
@Controller('flash-sale')
export class FlashSaleController {
  constructor(private readonly flashSaleService: FlashSaleService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Tạo flash sale mới (Admin/Seller)' })
  @ApiBody({ type: CreateFlashSaleDto })
  @ApiResponse({ status: 201, description: 'Flash sale created successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateFlashSaleDto) {
    return this.flashSaleService.create(dto);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active flash sales' })
  @ApiResponse({ status: 200, description: 'Active flash sales returned successfully.' })
  findActive() {
    return this.flashSaleService.findActive();
  }

  @Get()
  @ApiOperation({ summary: 'Get list of flash sales with pagination' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: Number })
  @ApiResponse({ status: 200, description: 'List of flash sales returned successfully.' })
  findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.flashSaleService.findAll(Number(page), Number(limit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a flash sale by ID' })
  @ApiParam({ name: 'id', description: 'Flash sale ID' })
  @ApiResponse({ status: 200, description: 'Flash sale returned successfully.' })
  findOne(@Param('id') id: string) {
    return this.flashSaleService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cập nhật flash sale (Admin/Seller)' })
  @ApiParam({ name: 'id', description: 'Flash sale ID' })
  @ApiBody({ type: CreateFlashSaleDto })
  @ApiResponse({ status: 200, description: 'Flash sale updated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(@Param('id') id: string, @Body() dto: CreateFlashSaleDto) {
    return this.flashSaleService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Xóa flash sale (Admin/Seller)' })
  @ApiParam({ name: 'id', description: 'Flash sale ID' })
  @ApiResponse({ status: 200, description: 'Flash sale deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  delete(@Param('id') id: string) {
    return this.flashSaleService.delete(id);
  }
}
