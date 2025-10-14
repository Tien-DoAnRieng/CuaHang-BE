import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role])
  ],
  exports: [TypeOrmModule]
})
export class UserModule {}