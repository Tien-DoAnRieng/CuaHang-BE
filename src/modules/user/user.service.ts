// src/modules/user/user.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// ⬇️ SỬA LỖI IMPORT: Role phải import từ role.entity
import { User } from '../../shared/schemas/entities/user.entity'; 
import { Role } from '../../shared/schemas/entities/role.entity'; 

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
}