import { Controller, Post, Patch, Body, UseGuards, Param, Request, Get, Req, Res, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody,ApiParam, ApiBearerAuth} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ChangeRoleDto } from './dto/change-role.dto';
import { RoleEnum } from '../../common/enums/role.enum';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetOtpDto } from './dto/verify-reset-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { Response } from 'express';

@ApiTags('Auth') // ✅ Nhóm endpoint trong Swagger
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({
    status: 201,
    description: 'Đăng ký thành công, hệ thống gửi mã OTP qua email',
    schema: {
      example: {
        message: 'Đăng ký thành công, vui lòng kiểm tra email để lấy mã xác thực',
      },
    },
  })
  async register(@Body() registerDto: RegisterUserDto) {
    return this.authService.register(registerDto);
  }

  @Post('verify')
  @Public()
  @ApiOperation({ summary: 'Xác thực email bằng mã OTP' })
  @ApiBody({
    schema: {
      example: {
        email: 'user@example.com',
        otp: '123456',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Xác thực email thành công',
    schema: {
      example: {
        message: 'Xác thực thành công',
      },
    },
  })
  async verifyEmail(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyEmail(body.email, body.otp);
  }
 

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập tài khoản' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công',
    schema: {
      example: {
        access_token: 'jwt.token.here',
        user: {
          id: 'uuid',
          name: 'Nguyễn Văn A',
          email: 'user@example.com',
          roles: [{ name: 'customer' }],
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Sai email hoặc mật khẩu' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  
}
 @Patch(':id/role')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
@ApiBearerAuth('access-token')
@ApiOperation({ summary: 'Admin/Seller đổi quyền user (Cả Admin và Seller đều có thể đổi quyền)' })
@ApiBody({ schema: { properties: { role: { type: 'string', enum: Object.values(RoleEnum) } } } })
@ApiResponse({ status: 200, description: 'Đổi role thành công' })
@ApiResponse({ status: 400, description: 'Bad Request - Role không hợp lệ' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 403, description: 'Forbidden' })
async updateUserRole(
  @Param('id') userId: string,
  @Body('role') newRole: string,
  @Request() req,
) {
  const adminId = req.user.id;
  
  if (!newRole || !Object.values(RoleEnum).includes(newRole as RoleEnum)) {
    throw new BadRequestException(`Role không hợp lệ. Các role hợp lệ: ${Object.values(RoleEnum).join(', ')}`);
  }
  
  console.log('[AuthController.updateUserRole]', { adminId, userId, newRole });
  return this.authService.updateUserRole(adminId, userId, newRole as RoleEnum);
}
@Post('forgot-password')
@Public()
@ApiOperation({ summary: 'Gửi mã OTP quên mật khẩu' })
@ApiBody({ type: ForgotPasswordDto })
async forgotPassword(@Body() dto: ForgotPasswordDto) {
  return this.authService.sendResetPasswordOtp(dto.email);
}

@Post('verify-reset-otp')
@Public()
@ApiOperation({ summary: 'Xác minh mã OTP quên mật khẩu' })
@ApiBody({ type: VerifyResetOtpDto })
async verifyResetOtp(@Body() dto: VerifyResetOtpDto) {
  return this.authService.verifyResetPasswordOtp(dto.email, dto.otp);
}

@Post('reset-password')
@Public()
@ApiOperation({ summary: 'Đặt lại mật khẩu mới' })
@ApiBody({ type: ResetPasswordDto })
async resetPassword(@Body() dto: ResetPasswordDto) {
  return this.authService.resetPassword(dto.email, dto.newPassword);
}

@Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Chuyển hướng đến Google để đăng nhập' })
  @ApiResponse({ status: 302, description: 'Redirect đến Google' })
  async googleAuth() {}
   
  
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google callback sau khi đăng nhập' })
  @ApiResponse({ status: 200, description: 'Đăng nhập Google thành công' })
  @ApiResponse({ status: 302, description: 'Redirect về frontend với token' })
  async googleAuthRedirect(@Req() req, @Res() res: any) {
    // Sử dụng service để tạo / tìm user và sign JWT
    const result = await this.authService.googleLogin(req);

    const FRONTEND = process.env.FRONTEND_URL || process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

    // Nếu không có token → redirect về trang login với lỗi
    const token = result?.accessToken || result?.access_token;
    if (!token) {
      const failedUrl = `${FRONTEND.replace(/\/$/, '')}/login?error=google_failed`;
      return res.redirect(failedUrl);
    }

    // Redirect về frontend callback để frontend lưu token và lấy profile
    const redirectUrl = `${FRONTEND.replace(/\/$/, '')}/auth/callback?access_token=${encodeURIComponent(
      token,
    )}`;

    return res.redirect(redirectUrl);
  }



}
