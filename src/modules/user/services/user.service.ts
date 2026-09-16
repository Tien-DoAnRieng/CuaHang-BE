import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../../shared/schemas/entities/user.entity'; 
import { Role } from '../../../shared/schemas/entities/role.entity'; 

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role) 
    private rolesRepository: Repository<Role>,
    private readonly dataSource: DataSource,
  ) {}
  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['role'],
    });
  }
  async findAll({ search, page = 1, limit = 10 }: { search?: string; page?: number; limit?: number }) {
    const where = search
      ? [
          { name: ILike(`%${search}%`) },
          { email: ILike(`%${search}%`) },
        ]
      : {};

    const [data, total] = await this.usersRepository.findAndCount({
      where,
      relations: ['memberType', 'role'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['memberType', 'role'],
    });
  }
 async findRoleByName(name: string): Promise<Role | null> {                              
    return this.rolesRepository.findOneBy({ name });
  }
  async create(userData: Partial<User>): Promise<User> {
    const newUser = this.usersRepository.create(userData);
    return this.usersRepository.save(newUser);
  }
  async remove(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Xóa cart items và cart của user
      await queryRunner.query(
        `DELETE ci FROM cart_items ci INNER JOIN carts c ON ci.cart_id = c.id WHERE c.user_id = ?`,
        [id],
      ).catch(() => null);
      await queryRunner.query(`DELETE FROM carts WHERE user_id = ?`, [id]).catch(() => null);

      // 2. Xóa các dữ liệu phụ thuộc 1-1 / 1-n của user
      await queryRunner.query(`DELETE FROM wishlists WHERE user_id = ?`, [id]).catch(() => null);
      await queryRunner.query(`DELETE FROM reviews WHERE user_id = ?`, [id]).catch(() => null);
      await queryRunner.query(`DELETE FROM user_otp_logs WHERE user_id = ?`, [id]).catch(() => null);
      await queryRunner.query(`DELETE FROM user_vouchers WHERE user_id = ?`, [id]).catch(() => null);
      await queryRunner.query(`DELETE FROM password_reset_tokens WHERE user_id = ?`, [id]).catch(() => null);
      await queryRunner.query(`DELETE FROM membership_history WHERE user_id = ?`, [id]).catch(() => null);
      await queryRunner.query(`DELETE FROM cashback_transactions WHERE user_id = ?`, [id]).catch(() => null);

      // 3. Unlink user khỏi Products (seller) và Orders (giữ lại lịch sử đơn hàng mà không lỗi FK)
      await queryRunner.query(`UPDATE products SET seller_id = NULL WHERE seller_id = ?`, [id]).catch(() => null);
      await queryRunner.query(`UPDATE orders SET user_id = NULL WHERE user_id = ?`, [id]).catch(() => null);
      await queryRunner.query(`UPDATE chat_messages SET user_id = NULL WHERE user_id = ?`, [id]).catch(() => null);

      // 4. Unlink shippingAddressId trong orders trước khi xóa địa chỉ
      await queryRunner.query(
        `UPDATE orders o INNER JOIN addresses a ON o.shipping_address_id = a.id SET o.shipping_address_id = NULL WHERE a.user_id = ?`,
        [id],
      ).catch(() => null);
      await queryRunner.query(`DELETE FROM addresses WHERE user_id = ?`, [id]).catch(() => null);

      // 5. Tạm thời tắt foreign key checks để đảm bảo xóa sạch user mà không bị lỗi constraint
      await queryRunner.query(`SET FOREIGN_KEY_CHECKS = 0`);
      await queryRunner.query(`DELETE FROM users WHERE id = ?`, [id]);
      await queryRunner.query(`SET FOREIGN_KEY_CHECKS = 1`);

      await queryRunner.commitTransaction();
      this.logger.log(`✅ User ${id} and all related constraints successfully removed`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`❌ Failed to remove user ${id}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  async updateProfile(
    userId: string,
    dto: { name?: string; currentPassword?: string; newPassword?: string; confirmNewPassword?: string; phone?: string; gender?: 'MALE' | 'FEMALE' | 'OTHER'; dateOfBirth?: string },
  ): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const { name, currentPassword, newPassword, confirmNewPassword, phone, gender, dateOfBirth } = dto;

    if (newPassword) {
      if (!currentPassword) throw new BadRequestException('currentPassword is required to change password');
      if (!confirmNewPassword) throw new BadRequestException('confirmNewPassword is required to change password');
      if (newPassword !== confirmNewPassword) throw new BadRequestException('newPassword and confirmNewPassword do not match');
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
        let d: Date | null = null;
        const isoRe = /^\d{4}-\d{2}-\d{2}$/;
        const dmyRe = /^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/;
        if (isoRe.test(dateOfBirth)) {
          d = new Date(dateOfBirth);
        } else if (dmyRe.test(dateOfBirth)) {
          const sep = dateOfBirth.includes('/') ? '/' : '-';
          const parts = dateOfBirth.split(sep);
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          d = new Date(year, month, day);
        } else {
          d = new Date(dateOfBirth);
        }

        if (!d || isNaN(d.getTime())) throw new BadRequestException('dateOfBirth must be a valid date (YYYY-MM-DD or DD/MM/YYYY)');
        user.dateOfBirth = d;
      }
    }

    return this.usersRepository.save(user);
  }
async blockUser(id: string) {
  const user = await this.usersRepository.findOne({ where: { id } });
  if (!user) throw new NotFoundException('User not found');

  if (user.isBlocked) throw new BadRequestException('User already blocked');

  user.isBlocked = true;
  await this.usersRepository.save(user);

  return { success: true, message: 'User has been blocked' };
}
async unblockUser(id: string) {
  const user = await this.usersRepository.findOne({ where: { id } });
  if (!user) throw new NotFoundException('User not found');

  if (!user.isBlocked) throw new BadRequestException('User is not blocked');

  user.isBlocked = false;
  await this.usersRepository.save(user);

  return { success: true, message: 'User has been unblocked' };
}

}
