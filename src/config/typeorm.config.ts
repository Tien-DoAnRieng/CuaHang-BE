import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

function createTypeOrmOptions(configService: ConfigService): TypeOrmModuleOptions {
  const get = (key: string, fallback?: any) => configService.get(key, fallback);

  return {
    type: 'mysql',
    host: get('DB_HOST', 'localhost'),
    port: Number(get('DB_PORT', 3306)),
    username: get('DB_USERNAME', 'root'),
    password: get('DB_PASSWORD', ''),
    database: get('DB_DATABASE', 'Ecommerce'),
    entities: [join(__dirname, '/../**/*.entity.{ts,js}')],

    // Đồng bộ database (chỉ true khi dev)
    synchronize: String(get('DB_SYNC', 'false')) === 'true',
    logging: String(get('DB_LOGGING', 'false')) === 'true',

    // Cấu hình encoding và tối ưu kết nối
    charset: 'utf8mb4',
    extra: {
      connectionLimit: 10,
      waitForConnections: true,
    },

    // Tự động load entity mà không cần import thủ công trong module
    autoLoadEntities: true,

    // Debug khi ở môi trường dev
    debug: process.env.NODE_ENV !== 'production',
    verboseRetryLog: true,
  };
}

export const typeOrmConfig: TypeOrmModuleAsyncOptions = {
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(__dirname, '..', '..', '.env')],
    }),
  ],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) =>
    createTypeOrmOptions(configService),
};
