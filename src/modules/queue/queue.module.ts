// src/queue/queue.module.ts
import { BullModule } from '@nestjs/bull';
import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { EmailProcessor } from '.././queue/processors/email.processor';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisHost = config.get('REDIS_HOST', 'localhost');
        const redisPort = config.get('REDIS_PORT', 6379);
        const redisPassword = config.get('REDIS_PASSWORD'); // Thêm dòng này

        const logger = new Logger('QueueModule');
        
        logger.log(`🔧 Configuring Redis connection: ${redisHost}:${redisPort}`);
        
        return {
          redis: {
            host: redisHost,
            port: redisPort,
            password: redisPassword || undefined,
            tls: config.get('REDIS_TLS') === 'true' ? {} : undefined,
            retryStrategy: (times: number) => {
              if (times > 3) {
                logger.error('❌ Redis connection failed after 3 retries. Please check if Redis is running.');
                return null; // Stop retrying
              }
              const delay = Math.min(times * 200, 2000);
              logger.warn(`⚠️ Redis connection retry ${times} after ${delay}ms`);
              return delay;
            },
            // Lưu ý: Không dùng enableReadyCheck và maxRetriesPerRequest vì Bull không cho phép cho subscriber
            // Bull sẽ tự quản lý retry và ready check
            lazyConnect: true, // Không kết nối ngay, chỉ kết nối khi cần
          },
        };
      },
    }),
    BullModule.registerQueue({ name: 'email' }),
  ],
  providers: [QueueService, EmailProcessor],
  exports: [QueueService],
})
export class QueueModule {}
