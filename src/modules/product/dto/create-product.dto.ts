import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  price: number;

  @IsString()
  brand: string;

  @IsString()
  category: string;

  @IsString()
  @IsOptional()
  status?: string;
}
