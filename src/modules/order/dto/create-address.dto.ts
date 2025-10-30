import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAddressDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'uuid-user' })
  userId: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Nguyễn Văn A' })
  recipientName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '0912345678' })
  phone: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '123 Đường ABC, Quận 1, TP.HCM' })
  fullAddress: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Phường 1' })
  ward: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Quận 1' })
  district: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'TP.HCM' })
  province: string;
}