import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateColorDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'hexCode must be a valid hex color code (e.g., #FF0000)',
  })
  hexCode: string;
}