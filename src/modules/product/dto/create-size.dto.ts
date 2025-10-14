import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSizeDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}