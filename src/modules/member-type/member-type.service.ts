import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberType } from '../../shared/schemas/entities/member-type.entity';
import { CreateMemberTypeDto, UpdateMemberTypeDto } from './dto/member-type.dto';

@Injectable()
export class MemberTypeService {
  constructor(
    @InjectRepository(MemberType)
    private memberTypeRepository: Repository<MemberType>,
  ) {}

  async create(createDto: CreateMemberTypeDto): Promise<MemberType> {
    const existing = await this.memberTypeRepository.findOne({
      where: { name: createDto.name },
    });
    if (existing) {
      throw new ConflictException('Tên loại thành viên đã tồn tại.');
    }
    const newType = this.memberTypeRepository.create(createDto);
    return this.memberTypeRepository.save(newType);
  }

  async findAll(): Promise<MemberType[]> {
    return this.memberTypeRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<MemberType> {
    const type = await this.memberTypeRepository.findOne({ where: { id } });
    if (!type) {
      throw new NotFoundException(`Không tìm thấy loại thành viên với ID ${id}.`);
    }
    return type;
  }

  async update(id: string, updateDto: UpdateMemberTypeDto): Promise<MemberType> {
    const type = await this.findOne(id);

    if (updateDto.name && updateDto.name !== type.name) {
      const existing = await this.memberTypeRepository.findOne({
        where: { name: updateDto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Tên loại thành viên mới đã tồn tại.');
      }
    }

    Object.assign(type, updateDto);
    return this.memberTypeRepository.save(type);
  }

  async remove(id: string): Promise<void> {
    const result = await this.memberTypeRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Không tìm thấy loại thành viên với ID ${id} để xóa.`);
    }
  }
}

