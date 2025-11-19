import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner } from '../../shared/schemas/entities/banner.entity';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Injectable()
export class BannerService {
  constructor(
    @InjectRepository(Banner)
    private bannerRepo: Repository<Banner>,
  ) {}

  async create(dto: CreateBannerDto) {
    const banner = this.bannerRepo.create(dto);
    return this.bannerRepo.save(banner);
  }

  async findAll() {
    return this.bannerRepo.find({
         where: { active: true },
      order: { priority: 'DESC' },
    });
  }

  async findOne(id: string) {
    const banner = await this.bannerRepo.findOne({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');
    return banner;
  }

  async update(id: string, dto: UpdateBannerDto) {
    await this.findOne(id);
    await this.bannerRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.bannerRepo.delete(id);
  }

  // 👉 Toggle active
  async toggleActive(id: string) {
    const banner = await this.findOne(id);
    banner.active = !banner.active;
    return this.bannerRepo.save(banner);
  }
}
