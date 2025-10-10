import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { join } from 'path';

export const typeOrmConfig: TypeOrmModuleAsyncOptions = {
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ✅ Cho phép dùng biến môi trường ở mọi module mà không cần import lại
      envFilePath: [join(__dirname, '..', '..', '.env')], // ✅ Đường dẫn đến file .env
    }),
  ],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const host = configService.get<string>('DB_HOST');
    const port = configService.get<number>('DB_PORT');
    const username = configService.get<string>('DB_USERNAME');
    const password = configService.get<string>('DB_PASSWORD');
    const database = configService.get<string>('DB_DATABASE');
    const sync = configService.get<string>('DB_SYNC') === 'true';
    const logging = configService.get<string>('DB_LOGGING') === 'true';
    return {
      type: 'mysql',
      host,
      port,
      username,
      password,
      database,
      entities: [join(__dirname, '/../**/*.entity.{ts,js}')],
      synchronize: sync,
      logging,
      charset: 'utf8mb4',
      dropSchema: sync, // This will drop the schema before synchronizing
      migrationsRun: false, // Disable automatic migration runs
    };
  },
};
