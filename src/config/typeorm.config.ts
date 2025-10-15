import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from '@nestjs/typeorm';

function createTypeOrmOptions(configService: ConfigService): TypeOrmModuleOptions {
  const get = (key: string, fallback?: any) => configService.get(key, fallback);

  return {
    type: 'mysql',
    host: get('DB_HOST', 'localhost'),
    port: Number(get('DB_PORT', 3306)),
    username: get('DB_USERNAME', 'root'),
    password: get('DB_PASSWORD', ''),
    database: get('DB_DATABASE', 'Ecommerce'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
   
    synchronize: String(get('DB_SYNC', 'false')) === 'true',
    logging: String(get('DB_LOGGING', 'false')) === 'true',   
    charset: 'utf8mb4',
  
    extra: {
      connectionLimit: 10,
      waitForConnections: true,
    },
    autoLoadEntities: true,
    
    debug: process.env.NODE_ENV !== 'production',
    verboseRetryLog: true,
  };
}

export const typeOrmConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => createTypeOrmOptions(configService),
};