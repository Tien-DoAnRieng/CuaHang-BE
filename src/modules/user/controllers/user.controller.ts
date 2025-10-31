import { Controller, Get, Query, Param, UseGuards, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleEnum } from '../../../common/enums/role.enum';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Admin: search & pagination
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Admin: Tìm kiếm & phân trang người dùng' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Danh sách người dùng phân trang' })
  async findAll(@Query('search') search?: string, @Query('page') page = 1, @Query('limit') limit = 10) {
    return this.userService.findAll({ search, page: Number(page), limit: Number(limit) });
  }

  // Admin: get user detail
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', required: true })
  @ApiOperation({ summary: 'Admin: Lấy chi tiết user theo id' })
  @ApiResponse({ status: 200, description: 'Chi tiết user' })
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  
  // Admin: xóa user
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', required: true })
  @ApiOperation({ summary: 'Admin: Xóa user theo id' })
  @ApiResponse({ status: 200, description: 'User đã bị xóa' })
  async remove(@Param('id') id: string) {
    await this.userService.remove(id);
    return { success: true };
  }
}
