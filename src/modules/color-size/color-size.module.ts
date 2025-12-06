import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ColorSize } from '../../shared/schemas/entities/color-size.entity';
import { Color } from '../../shared/schemas/entities/color.entity';
import { Size } from '../../shared/schemas/entities/size.entity';

import { ColorSizeController } from './color-size.controller';
import { ColorSizeService } from './color-size.service';

@Module({
  imports: [TypeOrmModule.forFeature([ColorSize, Color, Size])],
  controllers: [ColorSizeController],
  providers: [ColorSizeService],
})
export class ColorSizeModule {}
