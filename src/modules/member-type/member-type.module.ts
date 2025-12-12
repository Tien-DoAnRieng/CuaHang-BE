import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberTypeService } from './member-type.service';
import { MemberTypeController } from './member-type.controller';
import { MemberType } from '../../shared/schemas/entities/member-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MemberType])],
  controllers: [MemberTypeController],
  providers: [MemberTypeService],
  exports: [MemberTypeService],
})
export class MemberTypeModule {}




