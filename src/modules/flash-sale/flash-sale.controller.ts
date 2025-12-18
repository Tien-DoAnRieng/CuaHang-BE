import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger';
import { FlashSaleService } from './flash-sale.service';
import { CreateFlashSaleDto } from './dto/create-flash-sale.dto';
import { UpdateFlashSaleDto } from './dto/update-flash-sale.dto';

@ApiTags('Flash Sale')
@Controller('flash-sale')
export class FlashSaleController {
  constructor(private readonly flashSaleService: FlashSaleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new flash sale' })
  @ApiBody({ type: CreateFlashSaleDto })
  @ApiResponse({ status: 201, description: 'Flash sale created successfully.' })
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
  @ApiOperation({ summary: 'Update a flash sale by ID' })
  @ApiParam({ name: 'id', description: 'Flash sale ID' })
  @ApiBody({ type: CreateFlashSaleDto })
  @ApiResponse({ status: 200, description: 'Flash sale updated successfully.' })
  update(@Param('id') id: string, @Body() dto: CreateFlashSaleDto) {
    return this.flashSaleService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a flash sale by ID' })
  @ApiParam({ name: 'id', description: 'Flash sale ID' })
  @ApiResponse({ status: 200, description: 'Flash sale deleted successfully.' })
  delete(@Param('id') id: string) {
    return this.flashSaleService.delete(id);
  }
}
