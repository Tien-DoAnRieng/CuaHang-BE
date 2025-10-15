"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeOrmConfig = void 0;
const config_1 = require("@nestjs/config");
const path_1 = require("path");
exports.typeOrmConfig = {
    imports: [
        config_1.ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: [(0, path_1.join)(__dirname, '..', '..', '.env')],
        }),
    ],
    inject: [config_1.ConfigService],
    useFactory: async (configService) => {
        const host = configService.get('DB_HOST');
        const port = configService.get('DB_PORT');
        const username = configService.get('DB_USERNAME');
        const password = configService.get('DB_PASSWORD');
        const database = configService.get('DB_DATABASE');
        const sync = configService.get('DB_SYNC') === 'true';
        const logging = configService.get('DB_LOGGING') === 'true';
        return {
            type: 'mysql',
            host,
            port,
            username,
            password,
            database,
            entities: [(0, path_1.join)(__dirname, '/../**/*.entity.{ts,js}')],
            synchronize: sync,
            logging,
            charset: 'utf8mb4',
            dropSchema: sync,
            migrationsRun: false,
        };
    },
};
//# sourceMappingURL=typeorm.config.js.map