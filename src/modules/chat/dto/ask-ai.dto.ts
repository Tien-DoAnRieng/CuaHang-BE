import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class AskAiDto {
  @ApiProperty({ example: 'Cho toi xem san pham giay chay bo duoi 1 trieu' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    required: false,
    example: '2fd9a24f-2ad3-4e3a-b814-8e5dc9ea5d92',
    description: 'Product id tu trang chi tiet san pham (neu co)',
  })
  @IsOptional()
  @IsUUID()
  productId?: string;
}
