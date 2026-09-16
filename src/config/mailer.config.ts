import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerAsyncOptions } from '@nestjs-modules/mailer/dist/interfaces/mailer-async-options.interface';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import * as fs from 'fs';

function findTemplateDir(): string {
  const candidates = [
    join(__dirname, '../modules/auth/templates'),
    join(__dirname, '../../src/modules/auth/templates'),
    join(process.cwd(), 'src/modules/auth/templates'),
    join(process.cwd(), 'dist/src/modules/auth/templates'),
    join(process.cwd(), 'dist/modules/auth/templates'),
  ];

  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }

  return join(process.cwd(), 'src/modules/auth/templates');
}

export const mailerConfig: MailerAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const host = config.get<string>('MAIL_HOST', 'smtp.gmail.com');
    // Mặc định cổng 465 (SSL direct) tương thích tốt nhất trên Render & Cloud hosting
    const port = Number(config.get<number>('MAIL_PORT', 465));
    const secure = config.get<string>('MAIL_SECURE') === 'true' || port === 465;
    const user = config.get<string>('MAIL_USER');
    const pass = config.get<string>('MAIL_PASSWORD');
    const from = config.get<string>('MAIL_FROM') || `"E-Commerce Shop" <${user}>`;

    const templateDir = findTemplateDir();

    // Log cấu hình mail lúc khởi động để dễ debug trên Render
    console.log(`[MailerConfig] host=${host} port=${port} secure=${secure} user=${user ? user.substring(0, 5) + '...' : 'MISSING'} pass=${pass ? '***SET***' : 'MISSING'} from=${from}`);
    console.log(`[MailerConfig] templateDir=${templateDir} (exists=${fs.existsSync(templateDir)})`);

    return {
      transport: {
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        tls: {
          rejectUnauthorized: false,
        },
      },
      defaults: {
        from,
      },
      template: {
        dir: templateDir,
        adapter: new HandlebarsAdapter(),
        options: {
          strict: false,
        },
      },
    };
  },
};
