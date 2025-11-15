import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import * as bcrypt from 'bcryptjs';

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

  /** User cập nhật profile (tên + đổi mật khẩu) */
  async updateProfile(
    userId: string,
    dto: { name?: string; currentPassword?: string; newPassword?: string; confirmNewPassword?: string },
  ): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const { name, currentPassword, newPassword, confirmNewPassword } = dto;

    if (newPassword) {
      // require currentPassword
      if (!currentPassword) throw new BadRequestException('currentPassword is required to change password');
      if (!confirmNewPassword) throw new BadRequestException('confirmNewPassword is required to change password');
      if (newPassword !== confirmNewPassword) throw new BadRequestException('newPassword and confirmNewPassword do not match');
      // Ensure user has a stored password (OAuth users may not)
      if (!user.passwordHash) {
        throw new BadRequestException('User does not have a password set');
      }
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) throw new BadRequestException('current password is incorrect');
      const hashed = await bcrypt.hash(newPassword, 10);
      user.passwordHash = hashed;
    }

    if (name) user.name = name;

    return this.usersRepository.save(user);
  }
}
