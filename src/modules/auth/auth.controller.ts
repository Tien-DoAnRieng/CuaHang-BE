import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';

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
}
