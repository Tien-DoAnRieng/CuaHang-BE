import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateColorDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Red' })
  name: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'hexCode must be a valid hex color code (e.g., #FF0000)',
  })
  @ApiProperty({ example: '#FF0000' })
  hexCode: string;
}