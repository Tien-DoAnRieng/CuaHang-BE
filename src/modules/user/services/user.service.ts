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
    dto: { name?: string; currentPassword?: string; newPassword?: string; confirmNewPassword?: string; phone?: string; gender?: 'MALE' | 'FEMALE' | 'OTHER'; dateOfBirth?: string },
  ): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const { name, currentPassword, newPassword, confirmNewPassword, phone, gender, dateOfBirth } = dto;

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

    if (phone !== undefined) {
      user.phone = phone || null;
    }

    if (gender !== undefined) {
      const allowed = ['MALE', 'FEMALE', 'OTHER'];
      if (gender && !allowed.includes(gender)) throw new BadRequestException('gender must be one of MALE, FEMALE, OTHER');
      user.gender = gender || null;
    }

    if (dateOfBirth !== undefined) {
      if (dateOfBirth === '' || dateOfBirth === null) {
        user.dateOfBirth = null;
      } else {
        // Accept either ISO YYYY-MM-DD or DD/MM/YYYY or DD-MM-YYYY
        let d: Date | null = null;
        const isoRe = /^\d{4}-\d{2}-\d{2}$/;
        const dmyRe = /^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/;
        if (isoRe.test(dateOfBirth)) {
          d = new Date(dateOfBirth);
        } else if (dmyRe.test(dateOfBirth)) {
          const sep = dateOfBirth.includes('/') ? '/' : '-';
          const parts = dateOfBirth.split(sep);
          // parts: [DD, MM, YYYY]
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          d = new Date(year, month, day);
        } else {
          // fallback: attempt Date parsing
          d = new Date(dateOfBirth);
        }

        if (!d || isNaN(d.getTime())) throw new BadRequestException('dateOfBirth must be a valid date (YYYY-MM-DD or DD/MM/YYYY)');
        user.dateOfBirth = d;
      }
    }

    return this.usersRepository.save(user);
  }
}
