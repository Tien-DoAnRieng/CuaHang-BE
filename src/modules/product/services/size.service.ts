import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Size } from '../entities/size.entity';
import { CreateSizeDto } from '../dto/create-size.dto';
import { UpdateSizeDto } from '../dto/update-size.dto';

@Injectable()
export class SizeService {
  constructor(
    @InjectRepository(Size)
    private readonly sizeRepository: Repository<Size>,
  ) {}

  async create(createSizeDto: CreateSizeDto): Promise<Size> {
    const size = this.sizeRepository.create(createSizeDto);
    return await this.sizeRepository.save(size);
  }

  async findAll(): Promise<Size[]> {
    return await this.sizeRepository.find();
  }

  async findOne(id: string): Promise<Size> {
    const size = await this.sizeRepository.findOne({ where: { id } });
    if (!size) {
      throw new NotFoundException(`Size with ID "${id}" not found`);
    }
    return size;
  }

  async update(id: string, updateSizeDto: UpdateSizeDto): Promise<Size> {
    const size = await this.findOne(id);
    this.sizeRepository.merge(size, updateSizeDto);
    return await this.sizeRepository.save(size);
  }

  async remove(id: string): Promise<void> {
    const size = await this.findOne(id);
    await this.sizeRepository.remove(size);
  }
}