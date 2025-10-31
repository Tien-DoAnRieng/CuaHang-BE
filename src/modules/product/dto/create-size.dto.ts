import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSizeDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'L' })
  name: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'Large', required: false })
  description?: string;
}