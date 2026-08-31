import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigModule } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // ✅ Bật CORS (để Swagger và Frontend gọi API được).
  // Khi frontend gửi request kèm credentials, Access-Control-Allow-Origin
  // KHÔNG được là wildcard '*'. Đặt origin cụ thể hoặc đọc từ env.
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.FRONTEND_URL,
    process.env.FRONTEND_ORIGIN,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: (origin, callback) => {
      // Cho phép request không có origin (như mobile app, server-to-server, curl)
      if (!origin) return callback(null, true);

      // Cho phép localhost, các domain Vercel và Render
      if (
        origin.includes('localhost') ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com') ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Ecommerce API')
    .setDescription('API documentation for the Ecommerce project')
    .setVersion('1.0')
    .addTag('Ecommerce')
    .addServer('/')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .build();
    

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);


  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Server is running on: http://localhost:${process.env.PORT ?? 3000}/api`);

}

bootstrap();
