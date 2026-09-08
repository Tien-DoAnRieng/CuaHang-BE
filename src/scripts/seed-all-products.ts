/**
 * Seed script: Tạo đầy đủ dữ liệu cho toàn bộ 9 danh mục sản phẩm (mỗi danh mục 15 sản phẩm)
 * Tổng cộng: 9 x 15 = 135 sản phẩm đầy đủ biến thể, màu sắc, size, kho hàng, đánh giá và ảnh thật.
 * Chạy: npx ts-node -r tsconfig-paths/register src/scripts/seed-all-products.ts
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: false,
  entities: [],
});

function uuid() {
  return randomUUID();
}

function now() {
  return new Date();
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysBack = 30) {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(1, daysBack));
  d.setHours(randomInt(8, 22), randomInt(0, 59), randomInt(0, 59));
  return d;
}

// ========== COLORS ==========
const ALL_COLORS = [
  { name: 'Đen', hexCode: '#111827' },
  { name: 'Trắng', hexCode: '#f9fafb' },
  { name: 'Xám Titan', hexCode: '#6b7280' },
  { name: 'Xanh Navy', hexCode: '#1e3a8a' },
  { name: 'Xanh Dương', hexCode: '#2563eb' },
  { name: 'Xanh Rêu', hexCode: '#166534' },
  { name: 'Xanh Mint', hexCode: '#6ee7b7' },
  { name: 'Đỏ Ruby', hexCode: '#dc2626' },
  { name: 'Đỏ Burgundy', hexCode: '#881337' },
  { name: 'Hồng Pastel', hexCode: '#f472b6' },
  { name: 'Vàng Gold', hexCode: '#eab308' },
  { name: 'Titan Tự Nhiên', hexCode: '#c4b49a' },
  { name: 'Bạc', hexCode: '#cbd5e1' },
  { name: 'Be / Nude', hexCode: '#fef3c7' },
  { name: 'Nâu Da Bò', hexCode: '#78350f' },
  { name: 'Tím Lavender', hexCode: '#a855f7' },
  { name: 'Cam Cyberpunk', hexCode: '#f97316' },
];

// ========== SIZES ==========
const SIZES_DATA = [
  // Dung lượng điện thoại / tablet
  { name: '128GB', description: 'Bộ nhớ lưu trữ 128GB' },
  { name: '256GB', description: 'Bộ nhớ lưu trữ 256GB' },
  { name: '512GB', description: 'Bộ nhớ lưu trữ 512GB' },
  { name: '1TB', description: 'Bộ nhớ lưu trữ 1TB' },
  // Cấu hình laptop
  { name: '16GB RAM / 512GB SSD', description: 'Cấu hình tiêu chuẩn đồ họa & văn phòng' },
  { name: '32GB RAM / 1TB SSD', description: 'Cấu hình cao cấp chuyên đồ họa & gaming' },
  { name: '64GB RAM / 2TB SSD', description: 'Cấu hình max cấu hình workstation' },
  // Size thời trang
  { name: 'Size S', description: 'Size S (45kg - 55kg)' },
  { name: 'Size M', description: 'Size M (55kg - 65kg)' },
  { name: 'Size L', description: 'Size L (65kg - 75kg)' },
  { name: 'Size XL', description: 'Size XL (75kg - 85kg)' },
  { name: 'Size XXL', description: 'Size XXL (Trên 85kg)' },
  // Size đồng hồ & dung tích
  { name: 'Size 40mm', description: 'Đường kính mặt 40mm' },
  { name: 'Size 42mm / 44mm', description: 'Đường kính mặt 42-44mm' },
  { name: 'Dung tích 50ml', description: 'Chai tiêu chuẩn 50ml' },
  { name: 'Dung tích 100ml', description: 'Chai dung tích lớn 100ml' },
  { name: 'Tiêu Chuẩn', description: 'Kích thước tiêu chuẩn của nhà sản xuất' },
];

// ========== BRANDS ==========
const BRANDS_DATA = [
  // Công nghệ & Điện tử
  { name: 'Apple', description: 'Tập đoàn công nghệ hàng đầu thế giới từ Cupertino, Mỹ' },
  { name: 'Samsung', description: 'Tập đoàn điện tử công nghệ đa quốc gia Hàn Quốc' },
  { name: 'Google', description: 'Hãng công nghệ và smartphone Pixel hàng đầu của Mỹ' },
  { name: 'Xiaomi', description: 'Tập đoàn công nghệ và thiết bị thông minh nổi tiếng' },
  { name: 'OPPO', description: 'Hãng smartphone và thiết bị âm thanh thông minh' },
  { name: 'Vivo', description: 'Thương hiệu smartphone và công nghệ hình ảnh cao cấp' },
  { name: 'Sony', description: 'Tập đoàn công nghệ giải trí, âm thanh và máy ảnh Nhật Bản' },
  { name: 'Dell', description: 'Tập đoàn công nghệ máy tính xách tay và máy trạm hàng đầu' },
  { name: 'ASUS', description: 'Hãng sản xuất máy tính, linh kiện và ROG gaming hàng đầu' },
  { name: 'Lenovo', description: 'Hãng máy tính và laptop doanh nghiệp ThinkPad hàng đầu' },
  { name: 'HP', description: 'Tập đoàn công nghệ máy tính và thiết bị văn phòng của Mỹ' },
  { name: 'MSI', description: 'Chuyên gia phần cứng và laptop gaming hiệu năng cao' },
  { name: 'Acer', description: 'Nhà sản xuất máy tính xách tay và màn hình Đài Loan' },
  { name: 'OnePlus', description: 'Thương hiệu smartphone hiệu năng mạnh mẽ' },
  // Thời trang
  { name: 'Nike', description: 'Thương hiệu thời trang thể thao số 1 thế giới' },
  { name: 'Adidas', description: 'Tập đoàn trang phục và giày thể thao đa quốc gia Đức' },
  { name: 'Uniqlo', description: 'Thương hiệu thời trang ứng dụng LifeWear nổi tiếng Nhật Bản' },
  { name: 'Zara', description: 'Thương hiệu thời trang nhanh cao cấp hàng đầu thế giới' },
  { name: 'Levi’s', description: 'Hãng trang phục denim và đồ jean huyền thoại của Mỹ' },
  { name: 'Calvin Klein', description: 'Thương hiệu thời trang tối giản và quyến rũ của Mỹ' },
  { name: 'Mango', description: 'Thương hiệu thời trang phong cách Địa Trung Hải từ Tây Ban Nha' },
  { name: 'H&M', description: 'Tập đoàn bán lẻ thời trang nổi tiếng của Thụy Điển' },
  // Đồng hồ & Phụ kiện
  { name: 'Casio', description: 'Hãng đồng hồ điện tử và G-Shock bền bỉ nổi tiếng Nhật Bản' },
  { name: 'Seiko', description: 'Thương hiệu đồng hồ cơ khí và thể thao danh tiếng Nhật Bản' },
  { name: 'Tissot', description: 'Hãng đồng hồ Thụy Sĩ sang trọng với lịch sử từ năm 1853' },
  { name: 'Daniel Wellington', description: 'Hãng đồng hồ phong cách tối giản thanh lịch Thụy Điển' },
  { name: 'Garmin', description: 'Chuyên gia thiết bị đeo và đồng hồ thể thao thông minh GPS' },
  { name: 'Gentle Monster', description: 'Thương hiệu kính mát thời trang cao cấp từ Hàn Quốc' },
  // Gaming & Gears
  { name: 'Razer', description: 'Thương hiệu thiết bị và phụ kiện chơi game hàng đầu cho game thủ' },
  { name: 'Logitech', description: 'Tập đoàn thiết bị ngoại vi máy tính và gaming gear Thụy Sĩ' },
  { name: 'Corsair', description: 'Thương hiệu phần cứng và gaming gear cao cấp của Mỹ' },
  { name: 'SteelSeries', description: 'Nhà sản xuất phụ kiện và tai nghe gaming chuyên nghiệp' },
  { name: 'Keychron', description: 'Thương hiệu bàn phím cơ custom không dây nổi tiếng toàn cầu' },
  { name: 'HyperX', description: 'Hãng sản xuất tai nghe và phụ kiện chơi game chuyên nghiệp' },
  // Nhà cửa & Đời sống
  { name: 'Philips', description: 'Tập đoàn điện gia dụng và chăm sóc sức khỏe của Hà Lan' },
  { name: 'Dyson', description: 'Hãng công nghệ máy hút bụi và chăm sóc tóc đột phá từ Anh' },
  { name: 'Lock&Lock', description: 'Thương hiệu đồ gia dụng và bình giữ nhiệt cao cấp Hàn Quốc' },
  { name: 'Tefal', description: 'Thương hiệu chảo chống dính và nồi gia dụng cao cấp của Pháp' },
  { name: 'Roborock', description: 'Hãng robot hút bụi lau nhà thông minh cao cấp' },
  { name: 'Panasonic', description: 'Tập đoàn điện tử và đồ gia dụng hàng đầu Nhật Bản' },
  // Sức khỏe & Làm đẹp
  { name: 'La Roche-Posay', description: 'Thương hiệu dược mỹ phẩm hàng đầu được bác sĩ da liễu khuyên dùng' },
  { name: 'Estee Lauder', description: 'Tập đoàn mỹ phẩm và nước hoa xa xỉ hàng đầu của Mỹ' },
  { name: 'L’Oreal', description: 'Tập đoàn mỹ phẩm và chăm sóc sắc đẹp số 1 thế giới từ Pháp' },
  { name: 'Innisfree', description: 'Thương hiệu mỹ phẩm thiên nhiên nổi tiếng từ đảo Jeju Hàn Quốc' },
  { name: 'Laneige', description: 'Thương hiệu mỹ phẩm dưỡng ẩm và mặt nạ ngủ Hàn Quốc' },
  { name: 'Oral-B', description: 'Thương hiệu chăm sóc răng miệng và bàn chải điện hàng đầu' },
  { name: 'Kiehl’s', description: 'Thương hiệu mỹ phẩm dưỡng da cao cấp có nguồn gốc thảo dược từ Mỹ' },
];

// ========== CATEGORIES ==========
const CATEGORIES_DATA = [
  { name: 'Điện Tử', description: 'Thiết bị điện tử công nghệ cao', parentName: null },
  { name: 'Điện Thoại', description: 'Điện thoại thông minh các thương hiệu', parentName: 'Điện Tử' },
  { name: 'Tablet', description: 'Máy tính bảng đa dạng mẫu mã', parentName: 'Điện Tử' },
  { name: 'Laptop & PC', description: 'Laptop, máy tính để bàn và workstation', parentName: 'Điện Tử' },
  { name: 'Thời trang Nam', description: 'Trang phục, áo quần và phụ kiện thời trang nam', parentName: null },
  { name: 'Thời trang Nữ', description: 'Váy đầm, áo kiểu và thời trang nữ cao cấp', parentName: null },
  { name: 'Đồng hồ & Phụ kiện', description: 'Đồng hồ cơ, đồng hồ thông minh, kính mát và bóp ví cao cấp', parentName: null },
  { name: 'Gaming & Gears', description: 'Bàn phím cơ, chuột gaming, tai nghe và phụ kiện chơi game', parentName: null },
  { name: 'Nhà cửa & Đời sống', description: 'Thiết bị gia dụng thông minh, máy hút bụi, nồi chiên và nội thất', parentName: null },
  { name: 'Sức khỏe & Làm đẹp', description: 'Mỹ phẩm chăm sóc da, chăm sóc tóc và thiết bị làm đẹp', parentName: null },
];

// ========== IMPORT 9 NHÓM SẢN PHẨM ==========
import { PRODUCTS_CATALOG } from './products-catalog-data';

async function main() {
  console.log('🚀 Khởi động kết nối Database...');
  await AppDataSource.initialize();
  const qr = AppDataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    console.log('🧹 Đang dọn dẹp các bảng dữ liệu liên quan...');
    await qr.query('SET FOREIGN_KEY_CHECKS = 0');
    await qr.query('TRUNCATE TABLE reviews');
    await qr.query('TRUNCATE TABLE product_images');
    await qr.query('TRUNCATE TABLE product_variants');
    await qr.query('TRUNCATE TABLE products');
    await qr.query('TRUNCATE TABLE categories');
    await qr.query('TRUNCATE TABLE brands');
    await qr.query('TRUNCATE TABLE colors');
    await qr.query('TRUNCATE TABLE sizes');
    await qr.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✨ Seed bảng Colors & Sizes...');
    const colorMap = new Map<string, string>();
    for (const c of ALL_COLORS) {
      const id = uuid();
      await qr.query(
        'INSERT INTO colors (id, name, hex_code, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        [id, c.name, c.hexCode, now(), now()]
      );
      colorMap.set(c.name, id);
    }

    const sizeMap = new Map<string, string>();
    for (const s of SIZES_DATA) {
      const id = uuid();
      await qr.query(
        'INSERT INTO sizes (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        [id, s.name, s.description, now(), now()]
      );
      sizeMap.set(s.name, id);
    }

    console.log('✨ Seed bảng Brands...');
    const brandMap = new Map<string, string>();
    for (const b of BRANDS_DATA) {
      const id = uuid();
      await qr.query(
        'INSERT INTO brands (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        [id, b.name, b.description, now(), now()]
      );
      brandMap.set(b.name, id);
    }

    console.log('✨ Seed bảng Categories...');
    const categoryMap = new Map<string, string>();
    // Insert parent categories first
    for (const cat of CATEGORIES_DATA.filter(c => !c.parentName)) {
      const id = uuid();
      await qr.query(
        'INSERT INTO categories (id, name, description, parent_id, created_at, updated_at) VALUES (?, ?, ?, NULL, ?, ?)',
        [id, cat.name, cat.description, now(), now()]
      );
      categoryMap.set(cat.name, id);
    }
    // Insert child categories
    for (const cat of CATEGORIES_DATA.filter(c => c.parentName)) {
      const id = uuid();
      const parentId = categoryMap.get(cat.parentName!) || null;
      await qr.query(
        'INSERT INTO categories (id, name, description, parent_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [id, cat.name, cat.description, parentId, now(), now()]
      );
      categoryMap.set(cat.name, id);
    }

    // Lấy user IDs để làm review
    const users: any[] = await qr.query('SELECT id FROM users LIMIT 10');
    const userIds = users.length > 0 ? users.map(u => u.id) : [uuid()];

    console.log(`📦 Đang thêm toàn bộ 135 sản phẩm (${PRODUCTS_CATALOG.length} items)...`);

    let productCount = 0;
    let variantCount = 0;
    let imageCount = 0;
    let reviewCount = 0;

    for (const p of PRODUCTS_CATALOG) {
      const productId = uuid();
      const brandId = brandMap.get(p.brand) || null;
      const categoryId = categoryMap.get(p.category) || null;

      if (!categoryId) {
        console.warn(`⚠️ Không tìm thấy category "${p.category}" cho sản phẩm ${p.name}`);
      }

      await qr.query(
        `INSERT INTO products (id, name, description, price, cost_price, brand, brand_id, category_id, status, hasVariants, image, stock, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 1, ?, ?, ?, ?)`,
        [
          productId,
          p.name,
          p.description,
          p.price,
          p.costPrice || Math.round(p.price * 0.85),
          p.brand,
          brandId,
          categoryId,
          p.image,
          p.stock || 50,
          now(),
          now(),
        ]
      );
      productCount++;

      // Seed Product Images
      const images = p.images && p.images.length > 0 ? p.images : [p.image];
      for (let i = 0; i < images.length; i++) {
        await qr.query(
          `INSERT INTO product_images (id, product_id, image_url, is_main, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [uuid(), productId, images[i], i === 0 ? 1 : 0, now(), now()]
        );
        imageCount++;
      }

      // Seed Product Variants
      const colorOptions = p.colors && p.colors.length > 0 ? p.colors : ['Đen', 'Trắng'];
      const sizeOptions = p.sizes && p.sizes.length > 0 ? p.sizes : ['Tiêu Chuẩn'];

      for (const colorName of colorOptions) {
        const colorId = colorMap.get(colorName) || Array.from(colorMap.values())[0];
        for (const sizeName of sizeOptions) {
          const sizeId = sizeMap.get(sizeName) || Array.from(sizeMap.values())[0];
          const stockQty = randomInt(5, 30);
          const priceDiff = p.priceOverrideMap && p.priceOverrideMap[sizeName] ? p.priceOverrideMap[sizeName] : p.price;

          await qr.query(
            `INSERT INTO product_variants (id, product_id, color_id, size_id, stock_quantity, price_override, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [uuid(), productId, colorId, sizeId, stockQty, priceDiff, now(), now()]
          );
          variantCount++;
        }
      }

      // Seed Reviews
      const numReviews = randomInt(3, 7);
      const commentsPool = p.customReviews && p.customReviews.length > 0 ? p.customReviews : [
        'Sản phẩm dùng rất tốt, chất lượng vượt trội so với giá tiền.',
        'Đóng gói cẩn thận, giao hàng siêu nhanh. Sẽ ủng hộ shop dài dài!',
        'Rất hài lòng về chất lượng sản phẩm, đúng như mô tả.',
        'Hàng chính hãng xịn xò, màu sắc bên ngoài đẹp hơn trong ảnh.',
        'Shop tư vấn nhiệt tình, sản phẩm dùng rất ưng ý 5 sao!',
      ];

      for (let r = 0; r < numReviews; r++) {
        const uId = userIds[r % userIds.length];
        const rating = randomInt(4, 5);
        const comment = commentsPool[r % commentsPool.length];
        const rDate = randomDate(45);

        await qr.query(
          `INSERT INTO reviews (id, user_id, product_id, rating, comment, status, reply_date, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'APPROVED', NULL, ?, ?)`,
          [uuid(), uId, productId, rating, comment, rDate, rDate]
        );
        reviewCount++;
      }
    }

    await qr.commitTransaction();
    console.log('✅ Hoàn thành Seed toàn bộ 135 sản phẩm thành công!');
    console.log({
      productsAdded: productCount,
      variantsAdded: variantCount,
      imagesAdded: imageCount,
      reviewsAdded: reviewCount,
      categoriesTotal: CATEGORIES_DATA.length,
      brandsTotal: BRANDS_DATA.length,
    });
  } catch (error) {
    await qr.rollbackTransaction();
    console.error('❌ Lỗi khi seed sản phẩm:', error);
  } finally {
    await qr.release();
    await AppDataSource.destroy();
  }
}

main().catch(console.error);
