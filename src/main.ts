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
    'http://localhost:5173', // Frontend user
    'http://localhost:5174', // Frontend admin
    process.env.FRONTEND_URL,
    process.env.FRONTEND_ORIGIN,
  ].filter(Boolean); // Loại bỏ undefined

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
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
    .addTag('Ecommerce') // thêm tag cho nhóm API
    .addServer('http://localhost:3000') // hiện base URL trên Swagger
  .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token', // tên security scheme
    )
    .build();
    

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);


  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Server is running on: http://localhost:${process.env.PORT ?? 3000}/api`);

}

bootstrap();
