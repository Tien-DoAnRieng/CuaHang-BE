import { IsOptional, IsString, MinLength, Matches, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Nguyen Van B', description: 'Tên hiển thị mới' })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'currentPassword', description: 'Mật khẩu hiện tại (cần khi đổi mật khẩu)' })
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @ApiPropertyOptional({ example: 'newStrongPassword123', description: 'Mật khẩu mới (ít nhất 6 ký tự)' })
  newPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @ApiPropertyOptional({ example: 'newStrongPassword123', description: 'Nhập lại mật khẩu mới để xác nhận' })
  confirmNewPassword?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[+0-9\s-]{7,20}$/, { message: 'Số điện thoại không hợp lệ' })
  @ApiPropertyOptional({ example: '+84901234567', description: 'Số điện thoại (có thể có dấu +)' })
  phone?: string;

  @IsOptional()
  @IsString()
  @IsIn(['MALE', 'FEMALE', 'OTHER'])
  @ApiPropertyOptional({ example: 'MALE', enum: ['MALE', 'FEMALE', 'OTHER'], description: 'Giới tính' })
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}