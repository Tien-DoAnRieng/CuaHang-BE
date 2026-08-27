import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CalculateGhnFeeByNameDto, CalculateGhnFeeDto } from './dto/calculate-fee.dto';
import { GhnService } from './ghn.service';

@ApiTags('GHN')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('ghn')
export class GhnController {
  constructor(private readonly ghnService: GhnService) {}

  @Get('provinces')
  getProvinces() {
    return this.ghnService.getProvinces();
  }

  @Get('districts/:provinceId')
  getDistricts(@Param('provinceId', ParseIntPipe) provinceId: number) {
    return this.ghnService.getDistricts(provinceId);
  }

  @Get('wards/:districtId')
  getWards(@Param('districtId', ParseIntPipe) districtId: number) {
    return this.ghnService.getWards(districtId);
  }

  @Post('fee')
  calculateFee(@Body() dto: CalculateGhnFeeDto) {
    return this.ghnService.calculateFee(dto);
  }

  @Post('fee-by-address')
  calculateFeeByAddress(@Body() dto: CalculateGhnFeeByNameDto) {
    return this.ghnService.calculateFeeByName(dto);
  }
}