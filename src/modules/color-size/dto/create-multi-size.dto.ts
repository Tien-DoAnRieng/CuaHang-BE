import { IsUUID, IsArray, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddSizesToColorDto {
  @ApiProperty({ example: 'uuid-color' })
  @IsUUID()
  colorId: string;

  @ApiProperty({ example: ['uuid-size-1', 'uuid-size-2'] })
  @IsArray()
  @ArrayNotEmpty()
  sizeIds: string[];
}
