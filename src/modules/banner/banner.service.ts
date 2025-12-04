import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Banner } from '../../shared/schemas/entities/banner.entity';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Injectable()
export class BannerService {
  constructor(
    @InjectRepository(Banner)
    private bannerRepo: Repository<Banner>,
  ) {}

  // CREATE
  async create(dto: CreateBannerDto) {
    const banner = this.bannerRepo.create(dto);
    return this.bannerRepo.save(banner);
  }

  // FIND ALL ACTIVE
  async findAll() {
    return this.bannerRepo.find({
      where: { active: true },
      order: { priority: 'DESC' },
    });
  }

async findAllWithPagination(
  search?: string,
  page = 1,
  limit = 10,
  active?: boolean,
) {
  const where: any = {};
  if (search) where.title = Like(`%${search}%`);
  if (active !== undefined) where.active = active;

  const [data, total] = await this.bannerRepo.findAndCount({
    where,
    order: { priority: 'DESC' },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    data,
    total,
    page,
    lastPage: Math.ceil(total / limit),
  };
}


  // FIND ONE
  async findOne(id: string) {
    const banner = await this.bannerRepo.findOne({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');
    return banner;
  }

  // UPDATE
  async update(id: string, dto: UpdateBannerDto) {
    await this.findOne(id);
    await this.bannerRepo.update(id, dto);
    return this.findOne(id);
  }

  // DELETE
  async remove(id: string) {
    await this.findOne(id);
    return this.bannerRepo.delete(id);
  }

  // SET ACTIVE TRUE/FALSE
  async setActive(id: string, active: boolean) {
    const banner = await this.findOne(id);
    banner.active = active;
    return this.bannerRepo.save(banner);
  }

async findActiveBanners() {
  return this.bannerRepo.find({ where: { active: true } });
}


}
