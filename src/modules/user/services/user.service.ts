// src/modules/user/user.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';

// ⬇️ SỬA LỖI IMPORT: Role phải import từ role.entity
import { User } from '../../../shared/schemas/entities/user.entity'; 
import { Role } from '../../../shared/schemas/entities/role.entity'; 

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role) // Inject Role Repository
    private rolesRepository: Repository<Role>,
  ) {}

  // ⬇️ SỬA LỖI TS2322: Đổi Promise<User | undefined> thành Promise<User | null>
  async findOneByEmail(email: string): Promise<User | null> {
    //                                      ^^^^^^^^^^^^
    return this.usersRepository.findOne({
      where: { email },
      relations: ['role'], // Quan trọng: JOIN dữ liệu Role
    });
  }

  /** Admin: Tìm kiếm & phân trang người dùng */
  async findAll({ search, page = 1, limit = 10 }: { search?: string; page?: number; limit?: number }) {
    const where = search
      ? [
          { name: ILike(`%${search}%`) },
          { email: ILike(`%${search}%`) },
        ]
      : {};

    const [data, total] = await this.usersRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  // ⬇️ SỬA LỖI TS2322: Đổi Promise<Role | undefined> thành Promise<Role | null>
  async findRoleByName(name: string): Promise<Role | null> {
    //                                      ^^^^^^^^^^^^
    return this.rolesRepository.findOneBy({ name });
  }

  // Hàm tạo user (sẽ được gọi bởi AuthService)
  async create(userData: Partial<User>): Promise<User> {
    const newUser = this.usersRepository.create(userData);
    return this.usersRepository.save(newUser);
  }
 
  /** Admin: xóa user */
  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User ${id} not found`);
    }
  }
}