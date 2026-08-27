import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CalculateGhnFeeDto {
  @IsInt()
  @Min(1)
  toDistrictId!: number;

  @IsString()
  toWardCode!: string;

  @IsInt()
  @Min(1)
  weight!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  length?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  width?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  height?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  insuranceValue?: number;
}

export class CalculateGhnFeeByNameDto {
  @IsString()
  province!: string;

  @IsString()
  district!: string;

  @IsString()
  ward!: string;

  @IsInt()
  @Min(1)
  weight!: number;
}