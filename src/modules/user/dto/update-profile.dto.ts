import { IsOptional, IsString, MinLength } from 'class-validator';
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
}