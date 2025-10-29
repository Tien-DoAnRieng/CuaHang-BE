import { ApiProperty } from '@nestjs/swagger';
import { RoleEnum } from '../../../common/enums/role.enum';

export class ChangeRoleDto {
  @ApiProperty({ example: 'uuid-cua-user' })
  userId: string;

  @ApiProperty({
    example: RoleEnum.ADMIN,
    enum: RoleEnum,
    description: 'Vai trò mới muốn gán cho user (admin, customer, seller, guest)',
  })
  role: RoleEnum; // 🟢 Dùng enum luôn
}
