import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAddressDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  recipientName: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  fullAddress: string;

  @IsNotEmpty()
  @IsString()
  ward: string;

  @IsNotEmpty()
  @IsString()
  district: string;

  @IsNotEmpty()
  @IsString()
  province: string;
}