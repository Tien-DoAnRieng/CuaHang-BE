import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ColorSize } from '../../shared/schemas/entities/color-size.entity';
import { Color } from '../../shared/schemas/entities/color.entity';
import { Size } from '../../shared/schemas/entities/size.entity';
import { AddSizesToColorDto } from './dto/create-multi-size.dto';

@Injectable()
export class ColorSizeService {
  constructor(
    @InjectRepository(ColorSize)
    private readonly csRepo: Repository<ColorSize>,

    @InjectRepository(Color)
    private readonly colorRepo: Repository<Color>,

    @InjectRepository(Size)
    private readonly sizeRepo: Repository<Size>,
  ) {}

  async addSizesToColor(dto: AddSizesToColorDto) {
    const color = await this.colorRepo.findOne({ where: { id: dto.colorId } });
    if (!color) throw new NotFoundException('Color not found');

    const sizes = await this.sizeRepo.find({
      where: { id: In(dto.sizeIds) },
    });

    if (sizes.length !== dto.sizeIds.length)
      throw new NotFoundException('Some size IDs do not exist');

    const created: ColorSize[] = [];

    for (const s of sizes) {
      const exists = await this.csRepo.findOne({
        where: { colorId: color.id, sizeId: s.id },
      });

      if (!exists) {
        const cs = this.csRepo.create({
          colorId: color.id,
          sizeId: s.id,
        });

        await this.csRepo.save(cs);
        created.push(cs);
      }
    }

    return created;
  }

async getColorSizes(colorId: string) {
  return this.csRepo
    .createQueryBuilder('cs')
    .leftJoinAndSelect('cs.size', 'size')
    .select(['cs.id', 'cs.colorId', 'cs.sizeId', 'size.name'])
    .where('cs.colorId = :colorId', { colorId })
    .getMany();
}


  async removeSize(colorId: string, sizeId: string) {
    const entry = await this.csRepo.findOne({
      where: { colorId, sizeId },
    });

    if (!entry) throw new NotFoundException('Color-size not found');

    await this.csRepo.remove(entry);
    return { success: true };
  }
}
