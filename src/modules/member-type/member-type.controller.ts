import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { MemberTypeService } from './member-type.service';
import { MembershipService } from './membership.service';
import { CreateMemberTypeDto, UpdateMemberTypeDto } from './dto/member-type.dto';
import { MemberType } from '../../shared/schemas/entities/member-type.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleEnum } from '../../common/enums/role.enum';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('MemberType')
@Controller('member-types')
@ApiBearerAuth('access-token')
export class MemberTypeController {
  constructor(
    private readonly memberTypeService: MemberTypeService,
    private readonly membershipService: MembershipService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('dashboard/me')
  @ApiOperation({ summary: 'User: Xem thông tin hạng thành viên, tiến trình & lịch sử hoàn tiền' })
  async getDashboard(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not authenticated');
    return this.membershipService.getUserMembershipDashboard(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-vouchers')
  @ApiOperation({ summary: 'User: Lấy danh sách voucher cá nhân của tôi' })
  async getMyVouchers(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not authenticated');
    return this.membershipService.getUserVouchers(userId);
  }

  @Get('dashboard/user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Admin: Xem dashboard hạng thành viên của người dùng' })
  async getUserDashboard(@Param('userId') userId: string) {
    return this.membershipService.getUserMembershipDashboard(userId);
  }

  @Post('unlock-cashbacks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Admin: Mở khóa các giao dịch cashback đã qua 7 ngày' })
  async unlockCashbacks() {
    const count = await this.membershipService.unlockPendingCashbacks();
    return { message: `Successfully unlocked ${count} pending cashbacks`, unlockedCount: count };
  }

  @Post('recalculate-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Admin: Tính toán lại hạng thành viên cho tất cả người dùng' })
  async recalculateAll() {
    const count = await this.membershipService.recalculateAllUsers();
    return { message: `Recalculated tier for ${count} users`, count };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Tạo loại thành viên mới (Admin)' })
  @ApiBody({ type: CreateMemberTypeDto })
  @ApiResponse({ status: 201, description: 'Tạo mới loại thành viên thành công.', type: MemberType })
  async create(@Body() createDto: CreateMemberTypeDto): Promise<MemberType> {
    return this.memberTypeService.create(createDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả loại thành viên' })
  @ApiResponse({ status: 200, description: 'Danh sách loại thành viên.', type: [MemberType] })
  async findAll(): Promise<MemberType[]> {
    return this.memberTypeService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một loại thành viên' })
  @ApiParam({ name: 'id', required: true, description: 'ID của loại thành viên' })
  @ApiResponse({ status: 200, description: 'Chi tiết loại thành viên.', type: MemberType })
  async findOne(@Param('id') id: string): Promise<MemberType> {
    return this.memberTypeService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Cập nhật loại thành viên (Admin)' })
  @ApiParam({ name: 'id', required: true, description: 'ID của loại thành viên' })
  @ApiBody({ type: UpdateMemberTypeDto })
  @ApiResponse({ status: 200, description: 'Cập nhật loại thành viên thành công.', type: MemberType })
  async update(@Param('id') id: string, @Body() updateDto: UpdateMemberTypeDto): Promise<MemberType> {
    return this.memberTypeService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Xóa loại thành viên (Admin)' })
  @ApiParam({ name: 'id', required: true, description: 'ID của loại thành viên' })
  @ApiResponse({ status: 200, description: 'Xóa loại thành viên thành công.' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.memberTypeService.remove(id);
  }
}


