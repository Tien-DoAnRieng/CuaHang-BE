/**
 * Script để gán sản phẩm cho seller (dùng cho testing)
 * Chạy: npx ts-node src/scripts/assign-products-to-seller.ts <sellerEmail> <numberOfProducts>
 */

import { DataSource, IsNull } from 'typeorm';
import { Product } from '../shared/schemas/entities/product.entity';
import { User } from '../shared/schemas/entities/user.entity';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'ecommerce',
  entities: [Product, User],
  synchronize: false,
  logging: true,
});

async function assignProductsToSeller(sellerEmail: string, numberOfProducts: number = 5) {
  await AppDataSource.initialize();
  
  try {
    // Tìm seller theo email
    const sellerRepo = AppDataSource.getRepository(User);
    const seller = await sellerRepo.findOne({
      where: { email: sellerEmail },
      relations: ['role']
    });
    
    if (!seller) {
      console.error(`❌ Không tìm thấy seller với email: ${sellerEmail}`);
      process.exit(1);
    }
    
    if (seller.role?.name?.toLowerCase() !== 'seller') {
      console.warn(`⚠️ User ${sellerEmail} không phải là seller (role: ${seller.role?.name})`);
    }
    
    console.log(`✅ Tìm thấy seller: ${seller.name} (${seller.email}) - ID: ${seller.id}`);
    
    // Tìm các sản phẩm chưa có sellerId
    const productRepo = AppDataSource.getRepository(Product);
    const productsWithoutSeller = await productRepo.find({
      where: { sellerId: IsNull() },
      take: numberOfProducts
    });
    
    if (productsWithoutSeller.length === 0) {
      console.warn(`⚠️ Không có sản phẩm nào chưa có sellerId. Đang tìm sản phẩm bất kỳ...`);
      const allProducts = await productRepo.find({ take: numberOfProducts });
      if (allProducts.length === 0) {
        console.error(`❌ Không có sản phẩm nào trong database!`);
        process.exit(1);
      }
      
      // Gán sellerId cho các sản phẩm này (có thể đã có sellerId khác)
      for (const product of allProducts) {
        product.sellerId = seller.id;
        await productRepo.save(product);
        console.log(`✅ Đã gán sản phẩm "${product.name}" (${product.id}) cho seller`);
      }
    } else {
      // Gán sellerId cho các sản phẩm chưa có sellerId
      for (const product of productsWithoutSeller) {
        product.sellerId = seller.id;
        await productRepo.save(product);
        console.log(`✅ Đã gán sản phẩm "${product.name}" (${product.id}) cho seller`);
      }
    }
    
    // Kiểm tra lại
    const sellerProducts = await productRepo.find({
      where: { sellerId: seller.id }
    });
    
    console.log(`\n✅ Hoàn thành! Seller ${sellerEmail} hiện có ${sellerProducts.length} sản phẩm:`);
    sellerProducts.forEach(p => {
      console.log(`   - ${p.name} (${p.id})`);
    });
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

// Lấy arguments từ command line
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: npx ts-node src/scripts/assign-products-to-seller.ts <sellerEmail> [numberOfProducts]');
  console.log('Example: npx ts-node src/scripts/assign-products-to-seller.ts mucvan891@gmail.com 5');
  process.exit(1);
}

const sellerEmail = args[0];
const numberOfProducts = args[1] ? parseInt(args[1]) : 5;

assignProductsToSeller(sellerEmail, numberOfProducts);

