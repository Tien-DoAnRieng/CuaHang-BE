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

  
  synchronize: true,
    logging: get('DB_LOGGING', false),
  
    // Cấu hình encoding và tối ưu kết nối
    charset: 'utf8mb4',
    extra: {
      connectionLimit: 10,
      waitForConnections: true,
    },

    // Tự động load entity mà không cần import thủ công trong module
    autoLoadEntities: true,


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
