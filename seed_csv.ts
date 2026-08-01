import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ProductImportService } from './src/modules/product/services/product-import.service';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  console.log('Initializing application context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const productImportService = app.get(ProductImportService);
  
  const csvPath = path.join(__dirname, '../dummy_products_100.csv');
  console.log(`Reading CSV from ${csvPath}`);
  
  const buffer = fs.readFileSync(csvPath);
  const file: any = {
    buffer,
    originalname: 'dummy_products_100.csv',
    mimetype: 'text/csv'
  };

  try {
    const result = await productImportService.importFromFile(file as Express.Multer.File);
    console.log('Import result:', result);
  } catch (err) {
    console.error('Error importing:', err);
  }

  await app.close();
}

bootstrap();
