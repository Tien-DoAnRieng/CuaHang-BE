import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from '../../shared/schemas/entities/review.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Review])],
  exports: [TypeOrmModule],
})
export class ReviewModule {}
