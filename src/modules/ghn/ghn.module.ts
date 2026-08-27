import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GhnController } from './ghn.controller';
import { GhnService } from './ghn.service';

@Module({
  imports: [HttpModule],
  controllers: [GhnController],
  providers: [GhnService],
  exports: [GhnService],
})
export class GhnModule {}