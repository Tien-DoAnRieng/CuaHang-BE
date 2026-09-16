/**
 * Seed script: Xóa toàn bộ sản phẩm cũ và tạo dữ liệu mới
 * Gồm 3 nhóm: Điện thoại (15), Tablet (15), Laptop & PC (15)
 * Chạy: npx ts-node -r tsconfig-paths/register src/scripts/seed-products.ts
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

// ========== DATASOURCE CONFIG ==========
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

// ========== HELPERS ==========
function uuid() {
  return randomUUID();
}

function now() {
  return new Date();
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ========== COLORS & SIZES ==========
const COLORS = [
  { name: 'Đen', hexCode: '#1a1a1a' },
  { name: 'Trắng', hexCode: '#f5f5f5' },
  { name: 'Xanh Titan', hexCode: '#4a7c9e' },
  { name: 'Titan Tự Nhiên', hexCode: '#c4b49a' },
  { name: 'Titan Trắng', hexCode: '#e8e4dc' },
  { name: 'Xanh Dương', hexCode: '#1d4ed8' },
  { name: 'Bạc', hexCode: '#a8a9ad' },
  { name: 'Xanh Lá', hexCode: '#16a34a' },
  { name: 'Vàng', hexCode: '#ca8a04' },
  { name: 'Tím', hexCode: '#7c3aed' },
  { name: 'Hồng', hexCode: '#ec4899' },
  { name: 'Xám', hexCode: '#6b7280' },
  { name: 'Đỏ', hexCode: '#dc2626' },
  { name: 'Cam', hexCode: '#ea580c' },
];

const SIZES_PHONE_STORAGE = ['128GB', '256GB', '512GB', '1TB'];
const SIZES_LAPTOP_RAM = ['8GB RAM / 256GB SSD', '16GB RAM / 512GB SSD', '32GB RAM / 1TB SSD'];
const SIZES_TABLET_STORAGE = ['64GB WiFi', '128GB WiFi', '256GB WiFi + 5G'];

// ========== BRANDS ==========
const BRANDS = [
  { name: 'Apple', description: 'Thương hiệu công nghệ hàng đầu thế giới' },
  { name: 'Samsung', description: 'Tập đoàn điện tử đa quốc gia Hàn Quốc' },
  { name: 'Google', description: 'Hãng công nghệ AI và phần mềm hàng đầu' },
  { name: 'OnePlus', description: 'Thương hiệu smartphone cao cấp' },
  { name: 'Xiaomi', description: 'Hãng điện tử Trung Quốc nổi tiếng' },
  { name: 'OPPO', description: 'Thương hiệu smartphone sáng tạo' },
  { name: 'Vivo', description: 'Hãng điện thoại thông minh toàn cầu' },
  { name: 'Sony', description: 'Tập đoàn điện tử và giải trí Nhật Bản' },
  { name: 'Dell', description: 'Hãng máy tính nổi tiếng của Mỹ' },
  { name: 'HP', description: 'Hewlett-Packard - Hãng công nghệ lâu đời' },
  { name: 'Lenovo', description: 'Hãng máy tính đa quốc gia Trung Quốc' },
  { name: 'ASUS', description: 'Hãng máy tính Đài Loan hàng đầu' },
  { name: 'MSI', description: 'Chuyên gia về máy tính gaming' },
  { name: 'Acer', description: 'Hãng máy tính Đài Loan toàn cầu' },
];

// ========== CATEGORIES ==========
const CATEGORIES = [
  { name: 'Điện Tử', description: 'Các thiết bị điện tử công nghệ cao', parentName: null },
  { name: 'Điện Thoại', description: 'Điện thoại thông minh các thương hiệu', parentName: 'Điện Tử' },
  { name: 'Tablet', description: 'Máy tính bảng đa dạng mẫu mã', parentName: 'Điện Tử' },
  { name: 'Laptop & PC', description: 'Laptop, máy tính để bàn và workstation', parentName: 'Điện Tử' },
];

// ========== REVIEW DATA ==========
const REVIEW_COMMENTS = {
  phone: [
    'Máy rất mượt, camera chụp đẹp hơn mong đợi. Rất hài lòng!',
    'Pin trâu, sạc nhanh cực đỉnh. Dùng cả ngày không lo hết pin.',
    'Thiết kế đẹp, cầm trên tay rất sang. Màn hình rực rỡ.',
    'Hiệu năng mạnh mẽ, chơi game mượt không giật lag.',
    'Giá hơi cao nhưng chất lượng xứng đáng. Rất recommend!',
    'Camera đêm quá xuất sắc, chụp tối vẫn rõ nét.',
    'Màu sắc đẹp lắm, cầm vào cảm giác premium ngay.',
    'Hàng chính hãng, đóng gói cẩn thận. Giao nhanh.',
    'Xài được 1 tháng vẫn ổn định, không có vấn đề gì.',
    'Tuyệt vời! Nâng cấp từ đời cũ thấy khác biệt rõ rệt.',
  ],
  tablet: [
    'Màn hình lớn rõ nét, xem phim cực đỉnh. Âm thanh tốt.',
    'Dùng để vẽ và thiết kế rất mượt, cảm ứng nhạy.',
    'Pin lâu, dùng cả ngày học online không vấn đề gì.',
    'Gọn nhẹ, mang đi làm tiện lợi. Màn hình sắc nét.',
    'Hiệu năng mạnh, đa nhiệm tốt. Xứng đáng với giá tiền.',
    'Camera chất, gọi video đẹp. Con nhỏ dùng rất thích.',
    'Thiết kế sang trọng, mỏng nhẹ không tưởng.',
  ],
  laptop: [
    'Máy chạy mượt, phù hợp làm việc văn phòng và lập trình.',
    'Pin 12 tiếng thực tế đúng như quảng cáo. Ấn tượng!',
    'Màn hình 2K sắc nét, màu đẹp. Lý tưởng cho designer.',
    'Bàn phím gõ cực êm, chiếu sáng đẹp ban đêm.',
    'Build quality chắc chắn, máy mỏng nhẹ mà hiệu năng mạnh.',
    'SSD nhanh, khởi động Windows chỉ 8 giây. Ấn tượng!',
    'Gaming mượt mà ở cấu hình cao. Nhiệt độ kiểm soát tốt.',
    'Đáng tiền! Làm việc cả ngày không lag, không nóng.',
  ],
};

// ========== COUPON DATA ==========
const COUPON_DATA = [
  {
    code: 'TECH10',
    name: 'Giảm 10% sản phẩm Điện Tử',
    description: 'Áp dụng cho tất cả sản phẩm điện tử',
    discountType: 'PERCENT' as const,
    discountValue: 10,
    minOrderAmount: 2000000,
    maxDiscountAmount: 2000000,
    usageLimit: 200,
    usageLimitPerUser: 1,
  },
  {
    code: 'PHONE500K',
    name: 'Giảm 500.000đ mua điện thoại',
    description: 'Áp dụng cho đơn hàng điện thoại từ 10 triệu',
    discountType: 'AMOUNT' as const,
    discountValue: 500000,
    minOrderAmount: 10000000,
    maxDiscountAmount: null,
    usageLimit: 100,
    usageLimitPerUser: 1,
  },
  {
    code: 'LAPTOP15',
    name: 'Giảm 15% mua Laptop',
    description: 'Ưu đãi đặc biệt cho Laptop từ 15 triệu',
    discountType: 'PERCENT' as const,
    discountValue: 15,
    minOrderAmount: 15000000,
    maxDiscountAmount: 5000000,
    usageLimit: 50,
    usageLimitPerUser: 1,
  },
  {
    code: 'FREESHIP',
    name: 'Miễn phí vận chuyển',
    description: 'Miễn phí ship cho đơn hàng từ 500.000đ',
    discountType: 'AMOUNT' as const,
    discountValue: 50000,
    minOrderAmount: 500000,
    maxDiscountAmount: null,
    usageLimit: 0,
    usageLimitPerUser: 3,
  },
  {
    code: 'NEWMEMBER20',
    name: 'Ưu đãi thành viên mới 20%',
    description: 'Chỉ áp dụng lần đầu mua hàng',
    discountType: 'PERCENT' as const,
    discountValue: 20,
    minOrderAmount: 1000000,
    maxDiscountAmount: 3000000,
    usageLimit: 1000,
    usageLimitPerUser: 1,
  },
  {
    code: 'SALE2025',
    name: 'Sale cuối năm 2025 - Giảm 5%',
    description: 'Áp dụng cho mọi đơn hàng trong dịp cuối năm',
    discountType: 'PERCENT' as const,
    discountValue: 5,
    minOrderAmount: 0,
    maxDiscountAmount: 1000000,
    usageLimit: 500,
    usageLimitPerUser: 2,
  },
];

// ========== PRODUCTS DATA ==========
interface ProductData {
  name: string;
  description: string;
  price: number;
  costPrice: number;
  brandName: string;
  categoryName: string;
  stock: number;
  image: string;
  images: string[];
  colors: string[];
  sizes: string[];
  discount?: number; // phần trăm
  reviewCount: number;
  avgRating: number;
}

const PHONES: ProductData[] = [
  {
    name: 'iPhone 16 Pro Max',
    description: 'iPhone 16 Pro Max với chip A18 Pro mạnh nhất Apple từ trước đến nay. Camera 48MP với khả năng quay video 4K/120fps, màn hình Super Retina XDR 6.9 inch ProMotion 120Hz, pin 4685mAh hỗ trợ sạc nhanh 30W. Thiết kế Titan Grade 5 cứng cáp sang trọng.',
    price: 34990000,
    costPrice: 28000000,
    brandName: 'Apple',
    categoryName: 'Điện Thoại',
    stock: 50,
    image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&q=80',
      'https://images.unsplash.com/photo-1696446701796-da61c2b0b890?w=800&q=80',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80',
    ],
    colors: ['Đen', 'Titan Tự Nhiên', 'Titan Trắng', 'Xanh Titan'],
    sizes: ['256GB', '512GB', '1TB'],
    discount: 5,
    reviewCount: 45,
    avgRating: 4.9,
  },
  {
    name: 'iPhone 16 Plus',
    description: 'iPhone 16 Plus với màn hình Super AMOLED 6.7 inch, chip A18 mạnh mẽ, pin dung lượng cao lên đến 4674mAh. Camera 48MP + 12MP hỗ trợ Camera Control mới. Sạc nhanh 25W, hỗ trợ MagSafe.',
    price: 26990000,
    costPrice: 21000000,
    brandName: 'Apple',
    categoryName: 'Điện Thoại',
    stock: 65,
    image: 'https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=800&q=80',
      'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800&q=80',
    ],
    colors: ['Đen', 'Trắng', 'Hồng', 'Xanh Dương', 'Cam'],
    sizes: ['128GB', '256GB', '512GB'],
    reviewCount: 32,
    avgRating: 4.7,
  },
  {
    name: 'Samsung Galaxy S25 Ultra',
    description: 'Samsung Galaxy S25 Ultra với bút S Pen tích hợp, chip Snapdragon 8 Elite mạnh nhất 2025. Camera 200MP + 50MP + 10MP periscope zoom 10x quang học. Màn hình Dynamic AMOLED 6.9 inch 2600 nits, pin 5000mAh sạc nhanh 45W.',
    price: 33990000,
    costPrice: 27000000,
    brandName: 'Samsung',
    categoryName: 'Điện Thoại',
    stock: 40,
    image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80',
      'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=800&q=80',
    ],
    colors: ['Đen', 'Bạc', 'Titan', 'Xanh Dương'],
    sizes: ['256GB', '512GB', '1TB'],
    discount: 8,
    reviewCount: 38,
    avgRating: 4.8,
  },
  {
    name: 'Samsung Galaxy S25+',
    description: 'Galaxy S25+ với Snapdragon 8 Elite, màn hình Dynamic AMOLED 6.7 inch 120Hz, camera 50MP + 12MP + 10MP, pin 4900mAh sạc nhanh 45W không dây 15W. Hỗ trợ Galaxy AI tích hợp sâu vào hệ thống.',
    price: 26490000,
    costPrice: 21000000,
    brandName: 'Samsung',
    categoryName: 'Điện Thoại',
    stock: 55,
    image: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&q=80',
    ],
    colors: ['Đen', 'Bạc', 'Xanh Dương', 'Tím'],
    sizes: ['256GB', '512GB'],
    reviewCount: 27,
    avgRating: 4.7,
  },
  {
    name: 'Google Pixel 9 Pro XL',
    description: 'Google Pixel 9 Pro XL - điện thoại AI thuần túy nhất với chip Tensor G4. Camera 50MP + 48MP + 48MP telephoto, Magic Eraser, Best Take, Add Me. Màn hình LTPO OLED 6.8 inch, pin 5060mAh.',
    price: 29990000,
    costPrice: 23500000,
    brandName: 'Google',
    categoryName: 'Điện Thoại',
    stock: 30,
    image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&q=80',
    ],
    colors: ['Đen', 'Bạc', 'Hồng', 'Cam'],
    sizes: ['128GB', '256GB', '512GB', '1TB'],
    discount: 10,
    reviewCount: 22,
    avgRating: 4.6,
  },
  {
    name: 'OnePlus 13',
    description: 'OnePlus 13 với Snapdragon 8 Elite, camera Hasselblad 50MP + 50MP + 50MP periscope, màn hình LTPO4 AMOLED 6.82 inch 2K 120Hz, pin 6000mAh sạc siêu nhanh 100W. OxygenOS 15 mượt như iOS.',
    price: 20990000,
    costPrice: 16500000,
    brandName: 'OnePlus',
    categoryName: 'Điện Thoại',
    stock: 45,
    image: 'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=800&q=80',
    ],
    colors: ['Đen', 'Trắng', 'Xanh Dương'],
    sizes: ['256GB', '512GB'],
    reviewCount: 18,
    avgRating: 4.5,
  },
  {
    name: 'Xiaomi 15 Ultra',
    description: 'Xiaomi 15 Ultra với camera Leica 50MP + 200MP periscope zoom 10x, Snapdragon 8 Elite, pin 6100mAh sạc siêu nhanh 90W + sạc không dây 80W. Màn hình AMOLED 6.73 inch 2K 120Hz.',
    price: 25990000,
    costPrice: 20000000,
    brandName: 'Xiaomi',
    categoryName: 'Điện Thoại',
    stock: 35,
    image: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&q=80',
    ],
    colors: ['Đen', 'Trắng', 'Vàng'],
    sizes: ['256GB', '512GB', '1TB'],
    discount: 5,
    reviewCount: 25,
    avgRating: 4.6,
  },
  {
    name: 'OPPO Find X8 Pro',
    description: 'OPPO Find X8 Pro với camera Hasselblad 50MP + 50MP + 50MP periscope, chip MediaTek Dimensity 9400, màn hình BOE AMOLED 6.78 inch 2K 120Hz, pin 5910mAh sạc nhanh SUPERVOOC 80W.',
    price: 24990000,
    costPrice: 19500000,
    brandName: 'OPPO',
    categoryName: 'Điện Thoại',
    stock: 40,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
    ],
    colors: ['Đen', 'Trắng', 'Xanh Dương'],
    sizes: ['256GB', '512GB'],
    reviewCount: 20,
    avgRating: 4.5,
  },
  {
    name: 'Vivo X200 Ultra',
    description: 'Vivo X200 Ultra với camera ZEISS 200MP periscope, Snapdragon 8 Elite, pin 6000mAh sạc nhanh 90W. Màn hình LTPO AMOLED 6.82 inch 2K. Thiết kế premium với khung titan.',
    price: 23990000,
    costPrice: 18500000,
    brandName: 'Vivo',
    categoryName: 'Điện Thoại',
    stock: 25,
    image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&q=80',
    ],
    colors: ['Đen', 'Trắng'],
    sizes: ['256GB', '512GB'],
    reviewCount: 15,
    avgRating: 4.4,
  },
  {
    name: 'Samsung Galaxy Z Fold 6',
    description: 'Samsung Galaxy Z Fold 6 - điện thoại màn hình gập hàng đầu với Snapdragon 8 Gen 3. Màn hình ngoài 6.3 inch, màn hình trong 7.6 inch AMOLED 120Hz, camera 200MP chính, pin 4400mAh.',
    price: 44990000,
    costPrice: 36000000,
    brandName: 'Samsung',
    categoryName: 'Điện Thoại',
    stock: 20,
    image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80',
    ],
    colors: ['Đen', 'Bạc', 'Xanh Dương'],
    sizes: ['256GB', '512GB', '1TB'],
    discount: 10,
    reviewCount: 12,
    avgRating: 4.7,
  },
  {
    name: 'iPhone 15 Pro',
    description: 'iPhone 15 Pro với chip A17 Pro, camera 48MP Action button linh hoạt, cổng USB-C tốc độ cao, màn hình ProMotion 120Hz 6.1 inch, thiết kế Titan nhẹ hơn các thế hệ trước.',
    price: 27990000,
    costPrice: 22000000,
    brandName: 'Apple',
    categoryName: 'Điện Thoại',
    stock: 30,
    image: 'https://images.unsplash.com/photo-1696446701796-da61c2b0b890?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1696446701796-da61c2b0b890?w=800&q=80',
    ],
    colors: ['Đen', 'Titan Tự Nhiên', 'Titan Trắng', 'Xanh Titan'],
    sizes: ['128GB', '256GB', '512GB', '1TB'],
    discount: 15,
    reviewCount: 55,
    avgRating: 4.8,
  },
  {
    name: 'Xiaomi Redmi Note 14 Pro+',
    description: 'Redmi Note 14 Pro+ với Snapdragon 7s Gen 3, camera 200MP, màn hình AMOLED 6.67 inch 2K 120Hz, pin 5110mAh sạc nhanh 90W. Giá tầm trung nhưng tính năng cao cấp.',
    price: 9490000,
    costPrice: 7200000,
    brandName: 'Xiaomi',
    categoryName: 'Điện Thoại',
    stock: 80,
    image: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&q=80',
    ],
    colors: ['Đen', 'Trắng', 'Xanh Dương', 'Tím'],
    sizes: ['128GB', '256GB', '512GB'],
    reviewCount: 40,
    avgRating: 4.5,
  },
  {
    name: 'Samsung Galaxy A55 5G',
    description: 'Galaxy A55 5G với chip Exynos 1480 ổn định, camera 50MP OIS + 12MP + 5MP, màn hình Super AMOLED 6.6 inch 120Hz, pin 5000mAh, thiết kế kính Corning Gorilla Glass Victus+.',
    price: 9990000,
    costPrice: 7800000,
    brandName: 'Samsung',
    categoryName: 'Điện Thoại',
    stock: 70,
    image: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&q=80',
    ],
    colors: ['Đen', 'Trắng', 'Xanh Dương', 'Vàng'],
    sizes: ['128GB', '256GB'],
    reviewCount: 35,
    avgRating: 4.4,
  },
  {
    name: 'OPPO Reno 12 Pro',
    description: 'OPPO Reno 12 Pro với chip MediaTek Dimensity 9200+, camera 50MP + 50MP + 8MP, màn hình AMOLED 6.7 inch 120Hz, pin 5000mAh sạc nhanh SUPERVOOC 80W. Thiết kế mỏng nhẹ thời thượng.',
    price: 11990000,
    costPrice: 9200000,
    brandName: 'OPPO',
    categoryName: 'Điện Thoại',
    stock: 60,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
    ],
    colors: ['Đen', 'Trắng', 'Tím', 'Hồng'],
    sizes: ['256GB', '512GB'],
    discount: 5,
    reviewCount: 28,
    avgRating: 4.5,
  },
  {
    name: 'Sony Xperia 1 VI',
    description: 'Sony Xperia 1 VI - điện thoại chuyên nhiếp ảnh với camera Zeiss 52MP + 12MP + 12MP, Snapdragon 8 Gen 3, màn hình 6.5 inch 4K HDR OLED, pin 5000mAh sạc nhanh 30W, audio tích hợp jack 3.5mm.',
    price: 32990000,
    costPrice: 26500000,
    brandName: 'Sony',
    categoryName: 'Điện Thoại',
    stock: 15,
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80',
    ],
    colors: ['Đen', 'Bạc', 'Xanh Dương'],
    sizes: ['256GB', '512GB'],
    reviewCount: 10,
    avgRating: 4.6,
  },
];

const TABLETS: ProductData[] = [
  {
    name: 'iPad Pro M4 13 inch',
    description: 'iPad Pro M4 13 inch với chip Apple M4 mạnh nhất lịch sử tablet, màn hình Ultra Retina XDR 13 inch OLED tandem 2732x2048, mỏng chỉ 5.1mm. Hỗ trợ Apple Pencil Pro và bàn phím Magic Keyboard mới.',
    price: 34990000,
    costPrice: 28000000,
    brandName: 'Apple',
    categoryName: 'Tablet',
    stock: 30,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80',
      'https://images.unsplash.com/photo-1587613981449-afb3a24a253e?w=800&q=80',
    ],
    colors: ['Đen', 'Bạc'],
    sizes: ['256GB WiFi', '512GB WiFi', '256GB WiFi + 5G'],
    discount: 5,
    reviewCount: 25,
    avgRating: 4.9,
  },
  {
    name: 'iPad Pro M4 11 inch',
    description: 'iPad Pro M4 11 inch - công cụ sáng tạo chuyên nghiệp gọn nhẹ với chip M4, màn hình Ultra Retina XDR 11 inch OLED, camera 12MP + 10MP, FaceID, hỗ trợ Apple Pencil Pro.',
    price: 25990000,
    costPrice: 20500000,
    brandName: 'Apple',
    categoryName: 'Tablet',
    stock: 40,
    image: 'https://images.unsplash.com/photo-1587613981449-afb3a24a253e?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1587613981449-afb3a24a253e?w=800&q=80',
    ],
    colors: ['Đen', 'Bạc'],
    sizes: ['256GB WiFi', '512GB WiFi', '1TB WiFi'],
    reviewCount: 22,
    avgRating: 4.8,
  },
  {
    name: 'iPad Air M2 13 inch',
    description: 'iPad Air M2 13 inch - tablet tầm trung cao cấp với màn hình Liquid Retina 13 inch rộng lớn, chip M2 mạnh mẽ, camera 12MP, hỗ trợ Apple Pencil và bàn phím Magic Keyboard.',
    price: 22990000,
    costPrice: 18000000,
    brandName: 'Apple',
    categoryName: 'Tablet',
    stock: 35,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80',
    ],
    colors: ['Xanh Dương', 'Tím', 'Bạc', 'Vàng'],
    sizes: ['128GB WiFi', '256GB WiFi', '512GB WiFi + 5G'],
    reviewCount: 30,
    avgRating: 4.7,
  },
  {
    name: 'iPad Mini A17 Pro',
    description: 'iPad Mini thế hệ 7 với chip A17 Pro, màn hình Liquid Retina 8.3 inch nhỏ gọn, hỗ trợ Apple Pencil Pro. Thiết kế không viền, màu sắc tươi trẻ, camera 12MP, Pin cả ngày.',
    price: 15990000,
    costPrice: 12500000,
    brandName: 'Apple',
    categoryName: 'Tablet',
    stock: 50,
    image: 'https://images.unsplash.com/photo-1632516643720-e7f5d7d6ecc9?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1632516643720-e7f5d7d6ecc9?w=800&q=80',
    ],
    colors: ['Đen', 'Xanh Dương', 'Tím', 'Vàng'],
    sizes: ['128GB WiFi', '256GB WiFi', '256GB WiFi + 5G'],
    discount: 8,
    reviewCount: 28,
    avgRating: 4.7,
  },
  {
    name: 'Samsung Galaxy Tab S10 Ultra',
    description: 'Samsung Galaxy Tab S10 Ultra - máy tính bảng Android cao cấp nhất với màn hình Dynamic AMOLED 14.6 inch 2960x1848, chip Snapdragon 8 Gen 3, bút S Pen tích hợp, camera 13MP + 8MP kép.',
    price: 32990000,
    costPrice: 26500000,
    brandName: 'Samsung',
    categoryName: 'Tablet',
    stock: 20,
    image: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&q=80',
    ],
    colors: ['Đen', 'Bạc'],
    sizes: ['256GB WiFi', '512GB WiFi', '256GB WiFi + 5G'],
    discount: 10,
    reviewCount: 18,
    avgRating: 4.8,
  },
  {
    name: 'Samsung Galaxy Tab S10+',
    description: 'Samsung Galaxy Tab S10+ với màn hình Dynamic AMOLED 12.4 inch 2800x1752, chip Snapdragon 8 Gen 3, S Pen kèm hộp, camera 13MP chính, pin 10090mAh, thiết kế nhôm cao cấp.',
    price: 22990000,
    costPrice: 18000000,
    brandName: 'Samsung',
    categoryName: 'Tablet',
    stock: 30,
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80',
    ],
    colors: ['Đen', 'Bạc'],
    sizes: ['256GB WiFi', '512GB WiFi'],
    reviewCount: 22,
    avgRating: 4.7,
  },
  {
    name: 'Samsung Galaxy Tab S10 FE',
    description: 'Samsung Galaxy Tab S10 FE - tablet tầm trung cao cấp với màn hình TFT 10.9 inch FHD+, chip Exynos 1480, S Pen hỗ trợ, pin 10090mAh, camera 13MP, giá hợp lý.',
    price: 12990000,
    costPrice: 10000000,
    brandName: 'Samsung',
    categoryName: 'Tablet',
    stock: 45,
    image: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&q=80',
    ],
    colors: ['Đen', 'Bạc', 'Xanh Dương', 'Tím'],
    sizes: ['128GB WiFi', '256GB WiFi'],
    reviewCount: 35,
    avgRating: 4.5,
  },
  {
    name: 'Xiaomi Pad 7 Pro',
    description: 'Xiaomi Pad 7 Pro với màn hình LCD 11.2 inch 3.2K 144Hz, chip Snapdragon 8s Gen 3, pin 10100mAh sạc nhanh 67W, camera 50MP, hỗ trợ bút cảm ứng và bàn phím. Hiệu năng mạnh giá cạnh tranh.',
    price: 11990000,
    costPrice: 9200000,
    brandName: 'Xiaomi',
    categoryName: 'Tablet',
    stock: 40,
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
    ],
    colors: ['Đen', 'Bạc', 'Xanh Dương'],
    sizes: ['128GB WiFi', '256GB WiFi', '512GB WiFi + 5G'],
    discount: 5,
    reviewCount: 28,
    avgRating: 4.5,
  },
  {
    name: 'OPPO Pad 3 Pro',
    description: 'OPPO Pad 3 Pro với màn hình AMOLED 12.1 inch 2.8K 144Hz, chip Snapdragon 8 Gen 3, bút OPPO Pencil 3 hỗ trợ, pin 9510mAh sạc nhanh 67W. Thiết kế mỏng nhẹ chỉ 6.49mm.',
    price: 17990000,
    costPrice: 14000000,
    brandName: 'OPPO',
    categoryName: 'Tablet',
    stock: 25,
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80',
    ],
    colors: ['Đen', 'Bạc'],
    sizes: ['256GB WiFi', '512GB WiFi'],
    reviewCount: 15,
    avgRating: 4.5,
  },
  {
    name: 'iPad 10th Gen',
    description: 'iPad thế hệ 10 với màn hình Liquid Retina 10.9 inch, chip A14 Bionic, thiết kế hiện đại không viền 4 cạnh, camera 12MP, USB-C, hỗ trợ Apple Pencil gen 1. Tablet phổ thông hàng đầu.',
    price: 10990000,
    costPrice: 8500000,
    brandName: 'Apple',
    categoryName: 'Tablet',
    stock: 60,
    image: 'https://images.unsplash.com/photo-1632516643720-e7f5d7d6ecc9?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1632516643720-e7f5d7d6ecc9?w=800&q=80',
    ],
    colors: ['Xanh Dương', 'Hồng', 'Vàng', 'Bạc'],
    sizes: ['64GB WiFi', '256GB WiFi', '256GB WiFi + 5G'],
    discount: 10,
    reviewCount: 50,
    avgRating: 4.6,
  },
  {
    name: 'Lenovo Tab P12 Pro',
    description: 'Lenovo Tab P12 Pro với màn hình AMOLED 12.6 inch 2K, chip Snapdragon 870, pin 10200mAh, âm thanh Dolby Atmos 4 loa, bút Precision Pen 3 hỗ trợ, bàn phím Bluetooth tùy chọn.',
    price: 13990000,
    costPrice: 11000000,
    brandName: 'Lenovo',
    categoryName: 'Tablet',
    stock: 30,
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
    ],
    colors: ['Xám', 'Đen'],
    sizes: ['256GB WiFi', '512GB WiFi'],
    reviewCount: 20,
    avgRating: 4.3,
  },
  {
    name: 'Samsung Galaxy Tab A9+',
    description: 'Samsung Galaxy Tab A9+ với màn hình TFT 11 inch FHD+, chip Snapdragon 695, pin 7040mAh, bộ nhớ 8GB RAM + 128GB, hỗ trợ thẻ MicroSD, 4 loa. Tablet tầm trung ổn định bền bỉ.',
    price: 7990000,
    costPrice: 6200000,
    brandName: 'Samsung',
    categoryName: 'Tablet',
    stock: 55,
    image: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&q=80',
    ],
    colors: ['Đen', 'Bạc', 'Xanh Dương'],
    sizes: ['64GB WiFi', '128GB WiFi'],
    reviewCount: 42,
    avgRating: 4.3,
  },
  {
    name: 'Google Pixel Tablet',
    description: 'Google Pixel Tablet với chip Tensor G2, màn hình LCD 10.95 inch 2560x1600, pin 7020mAh, đi kèm đế sạc kiêm loa. Tích hợp Google AI sâu nhất trên tablet, trải nghiệm Android thuần khiết.',
    price: 15990000,
    costPrice: 12500000,
    brandName: 'Google',
    categoryName: 'Tablet',
    stock: 20,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80',
    ],
    colors: ['Bạc', 'Xanh Dương', 'Hồng'],
    sizes: ['128GB WiFi', '256GB WiFi'],
    reviewCount: 15,
    avgRating: 4.4,
  },
  {
    name: 'Vivo Pad 3 Pro',
    description: 'Vivo Pad 3 Pro với màn hình AMOLED 12.1 inch 3K 144Hz, chip Snapdragon 8 Gen 3, pin 10000mAh sạc nhanh 44W, camera 50MP, bàn phím và bút cảm ứng hỗ trợ.',
    price: 14990000,
    costPrice: 11800000,
    brandName: 'Vivo',
    categoryName: 'Tablet',
    stock: 25,
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
    ],
    colors: ['Đen', 'Bạc'],
    sizes: ['256GB WiFi', '256GB WiFi + 5G'],
    discount: 8,
    reviewCount: 12,
    avgRating: 4.4,
  },
  {
    name: 'iPad Air M3',
    description: 'iPad Air M3 thế hệ mới nhất với chip M3 mạnh mẽ, màn hình Liquid Retina 11 inch hoặc 13 inch, hỗ trợ Apple Intelligence, Apple Pencil Pro, Magic Keyboard. Hiệu năng đột phá cho sáng tạo.',
    price: 20990000,
    costPrice: 16500000,
    brandName: 'Apple',
    categoryName: 'Tablet',
    stock: 35,
    image: 'https://images.unsplash.com/photo-1587613981449-afb3a24a253e?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1587613981449-afb3a24a253e?w=800&q=80',
    ],
    colors: ['Xanh Dương', 'Tím', 'Bạc', 'Vàng'],
    sizes: ['128GB WiFi', '256GB WiFi', '512GB WiFi', '256GB WiFi + 5G'],
    reviewCount: 20,
    avgRating: 4.8,
  },
];

const LAPTOPS: ProductData[] = [
  {
    name: 'MacBook Pro M4 Pro 14 inch',
    description: 'MacBook Pro M4 Pro 14 inch với chip M4 Pro 14-core CPU + 20-core GPU, RAM 24GB, màn hình Liquid Retina XDR 14.2 inch 3024x1964 120Hz, pin 22 giờ, cổng kết nối đầy đủ HDMI/SD card/Thunderbolt 5.',
    price: 59990000,
    costPrice: 48000000,
    brandName: 'Apple',
    categoryName: 'Laptop & PC',
    stock: 15,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
    ],
    colors: ['Đen', 'Bạc'],
    sizes: ['16GB RAM / 512GB SSD', '24GB RAM / 512GB SSD', '32GB RAM / 1TB SSD'],
    reviewCount: 20,
    avgRating: 4.9,
  },
  {
    name: 'MacBook Pro M4 Max 16 inch',
    description: 'MacBook Pro M4 Max 16 inch - workstation di động đỉnh cao với M4 Max 16-core CPU + 40-core GPU, RAM lên đến 128GB, màn hình Liquid Retina XDR 16.2 inch, pin 22 giờ, loa 6 speaker chất lượng âm thanh phòng thu.',
    price: 89990000,
    costPrice: 72000000,
    brandName: 'Apple',
    categoryName: 'Laptop & PC',
    stock: 10,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
    ],
    colors: ['Đen', 'Bạc'],
    sizes: ['36GB RAM / 512GB SSD', '48GB RAM / 1TB SSD'],
    discount: 5,
    reviewCount: 12,
    avgRating: 4.9,
  },
  {
    name: 'MacBook Air M3 15 inch',
    description: 'MacBook Air M3 15 inch - laptop mỏng nhẹ đỉnh cao với chip M3, màn hình Liquid Retina 15.3 inch, pin 18 giờ, không quạt không tiếng ồn. Lý tưởng cho sinh viên và dân văn phòng.',
    price: 39990000,
    costPrice: 32000000,
    brandName: 'Apple',
    categoryName: 'Laptop & PC',
    stock: 25,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    ],
    colors: ['Bạc', 'Vàng', 'Đen', 'Xanh Dương'],
    sizes: ['8GB RAM / 256GB SSD', '16GB RAM / 512GB SSD', '24GB RAM / 1TB SSD'],
    reviewCount: 35,
    avgRating: 4.8,
  },
  {
    name: 'Dell XPS 15 9530',
    description: 'Dell XPS 15 9530 với Intel Core i9-13900H, màn hình OLED 15.6 inch 3.5K 120Hz, RTX 4070 8GB, thiết kế nhôm cao cấp, loa Speakers Dbrand, pin 86Whr. Màn hình đẹp nhất phân khúc.',
    price: 54990000,
    costPrice: 44000000,
    brandName: 'Dell',
    categoryName: 'Laptop & PC',
    stock: 12,
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80',
    ],
    colors: ['Bạc', 'Đen'],
    sizes: ['16GB RAM / 512GB SSD', '32GB RAM / 1TB SSD'],
    reviewCount: 15,
    avgRating: 4.7,
  },
  {
    name: 'ASUS ROG Zephyrus G16 2025',
    description: 'ASUS ROG Zephyrus G16 với AMD Ryzen AI Max+ 395, RTX 5090 24GB, màn hình OLED 16 inch 2.5K 240Hz, RAM 32GB LPDDR5x, thiết kế AniMe Matrix LED. Laptop gaming và AI đỉnh nhất 2025.',
    price: 69990000,
    costPrice: 56000000,
    brandName: 'ASUS',
    categoryName: 'Laptop & PC',
    stock: 8,
    image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80',
    ],
    colors: ['Xám', 'Đen'],
    sizes: ['32GB RAM / 1TB SSD'],
    discount: 5,
    reviewCount: 8,
    avgRating: 4.8,
  },
  {
    name: 'HP Spectre x360 14 2025',
    description: 'HP Spectre x360 14 với Intel Core Ultra 7 265H, màn hình OLED 14 inch 2.8K 120Hz, Intel Arc Graphics, RAM 32GB, SSD 2TB, thiết kế 2-in-1 gập 360 độ. Bút cảm ứng tích hợp.',
    price: 45990000,
    costPrice: 37000000,
    brandName: 'HP',
    categoryName: 'Laptop & PC',
    stock: 15,
    image: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&q=80',
    ],
    colors: ['Bạc', 'Đen'],
    sizes: ['16GB RAM / 512GB SSD', '32GB RAM / 1TB SSD'],
    reviewCount: 12,
    avgRating: 4.6,
  },
  {
    name: 'Lenovo ThinkPad X1 Carbon Gen 13',
    description: 'ThinkPad X1 Carbon Gen 13 với Intel Core Ultra 7 165U, màn hình IPS 14 inch 2.8K 90Hz, RAM 32GB LPDDR5x, SSD 1TB, trọng lượng chỉ 1.12kg. Laptop doanh nhân bền bỉ hàng đầu thế giới.',
    price: 42990000,
    costPrice: 34000000,
    brandName: 'Lenovo',
    categoryName: 'Laptop & PC',
    stock: 18,
    image: 'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=800&q=80',
    ],
    colors: ['Đen'],
    sizes: ['16GB RAM / 512GB SSD', '32GB RAM / 1TB SSD'],
    reviewCount: 18,
    avgRating: 4.7,
  },
  {
    name: 'MSI Titan GT77 HX',
    description: 'MSI Titan GT77 HX với Intel Core i9-13980HX, RTX 4090 16GB, màn hình IPS 17.3 inch 4K 144Hz, RAM 64GB DDR5, SSD 4TB. Laptop gaming workstation mạnh nhất thị trường hiện tại.',
    price: 79990000,
    costPrice: 64000000,
    brandName: 'MSI',
    categoryName: 'Laptop & PC',
    stock: 5,
    image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80',
    ],
    colors: ['Đen'],
    sizes: ['32GB RAM / 1TB SSD'],
    discount: 8,
    reviewCount: 6,
    avgRating: 4.8,
  },
  {
    name: 'Acer Swift 14 AI',
    description: 'Acer Swift 14 AI với Intel Core Ultra 9 288V, Intel Arc 140V GPU, màn hình OLED 14 inch 2.8K 120Hz, RAM 32GB LPDDR5x, SSD 1TB, trọng lượng 1.2kg, pin 17 giờ.',
    price: 29990000,
    costPrice: 24000000,
    brandName: 'Acer',
    categoryName: 'Laptop & PC',
    stock: 22,
    image: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&q=80',
    ],
    colors: ['Bạc', 'Xanh Dương'],
    sizes: ['16GB RAM / 512GB SSD', '32GB RAM / 1TB SSD'],
    reviewCount: 20,
    avgRating: 4.5,
  },
  {
    name: 'ASUS Zenbook 14 OLED 2025',
    description: 'ASUS Zenbook 14 OLED với Snapdragon X Elite, màn hình OLED 14 inch 2.8K 120Hz, RAM 32GB LPDDR5x, SSD 1TB, trọng lượng 1.27kg, pin 15 giờ. Hiệu năng AI NPU 75 TOPS.',
    price: 32990000,
    costPrice: 26000000,
    brandName: 'ASUS',
    categoryName: 'Laptop & PC',
    stock: 20,
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80',
    ],
    colors: ['Bạc', 'Đen', 'Xanh Dương'],
    sizes: ['16GB RAM / 512GB SSD', '32GB RAM / 1TB SSD'],
    reviewCount: 22,
    avgRating: 4.6,
  },
  {
    name: 'Dell Alienware m18 R2',
    description: 'Dell Alienware m18 R2 - laptop gaming khổng lồ với Intel Core i9-14900HX, RTX 4090 16GB, màn hình QHD 18 inch 165Hz, RAM 32GB DDR5, hệ thống tản nhiệt Quad-Fan Cryo-Tech v4.',
    price: 74990000,
    costPrice: 60000000,
    brandName: 'Dell',
    categoryName: 'Laptop & PC',
    stock: 6,
    image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80',
    ],
    colors: ['Đen'],
    sizes: ['32GB RAM / 1TB SSD'],
    reviewCount: 5,
    avgRating: 4.7,
  },
  {
    name: 'HP Omen 17 2025',
    description: 'HP Omen 17 với Intel Core i9-14900HX, RTX 4080 12GB, màn hình IPS 17.3 inch QHD 165Hz, RAM 32GB DDR5, SSD 1TB + HDD 1TB, hệ thống tản nhiệt Omen Tempest Cooling.',
    price: 52990000,
    costPrice: 42000000,
    brandName: 'HP',
    categoryName: 'Laptop & PC',
    stock: 10,
    image: 'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=800&q=80',
    ],
    colors: ['Đen'],
    sizes: ['16GB RAM / 512GB SSD', '32GB RAM / 1TB SSD'],
    discount: 10,
    reviewCount: 10,
    avgRating: 4.6,
  },
  {
    name: 'Lenovo LOQ 15 Gen 4',
    description: 'Lenovo LOQ 15 Gen 4 với AMD Ryzen 7 8845H, RTX 4060 8GB, màn hình IPS 15.6 inch FHD 144Hz, RAM 16GB DDR5, SSD 512GB. Laptop gaming tầm trung giá tốt nhất thị trường.',
    price: 24990000,
    costPrice: 19500000,
    brandName: 'Lenovo',
    categoryName: 'Laptop & PC',
    stock: 30,
    image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80',
    ],
    colors: ['Xám', 'Đen'],
    sizes: ['8GB RAM / 256GB SSD', '16GB RAM / 512GB SSD', '32GB RAM / 1TB SSD'],
    reviewCount: 25,
    avgRating: 4.5,
  },
  {
    name: 'ASUS TUF Gaming A15 2025',
    description: 'ASUS TUF Gaming A15 với AMD Ryzen 9 8945H, RTX 4070 8GB, màn hình IPS 15.6 inch 2K 165Hz, RAM 16GB, SSD 512GB. Thiết kế chắc chắn MIL-STD-810H, tản nhiệt tốt.',
    price: 26990000,
    costPrice: 21500000,
    brandName: 'ASUS',
    categoryName: 'Laptop & PC',
    stock: 25,
    image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80',
    ],
    colors: ['Đen', 'Xám'],
    sizes: ['8GB RAM / 256GB SSD', '16GB RAM / 512GB SSD'],
    discount: 5,
    reviewCount: 30,
    avgRating: 4.5,
  },
  {
    name: 'MacBook Air M3 13 inch',
    description: 'MacBook Air M3 13 inch - laptop nhẹ nhất và phổ thông nhất của Apple với chip M3 mạnh mẽ, màn hình Retina 13.6 inch, pin 18 giờ, RAM 8GB/16GB tùy cấu hình, thiết kế không quạt im lặng tuyệt đối.',
    price: 27990000,
    costPrice: 22500000,
    brandName: 'Apple',
    categoryName: 'Laptop & PC',
    stock: 40,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    ],
    colors: ['Bạc', 'Vàng', 'Đen', 'Xanh Dương'],
    sizes: ['8GB RAM / 256GB SSD', '16GB RAM / 512GB SSD', '24GB RAM / 1TB SSD'],
    reviewCount: 45,
    avgRating: 4.8,
  },
];

// ========== MAIN SEED FUNCTION ==========
async function seed() {
  console.log('🚀 Bắt đầu kết nối database...');
  await AppDataSource.initialize();
  console.log('✅ Database connected!');

  const qr = AppDataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    // ========== 1. XÓA DỮ LIỆU CŨ ==========
    console.log('\n🗑️  Đang xóa dữ liệu cũ...');
    await qr.query('SET FOREIGN_KEY_CHECKS = 0');
    await qr.query('DELETE FROM reviews');
    await qr.query('DELETE FROM product_images');
    await qr.query('DELETE FROM product_variants');
    await qr.query('DELETE FROM products');
    await qr.query('DELETE FROM coupons');
    await qr.query('DELETE FROM brands');
    await qr.query('DELETE FROM colors');
    await qr.query('DELETE FROM sizes');
    await qr.query('DELETE FROM categories');
    await qr.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Xóa dữ liệu cũ thành công!');

    // ========== 2. TẠO COLORS ==========
    console.log('\n🎨 Tạo colors...');
    const colorMap = new Map<string, string>();
    for (const c of COLORS) {
      const id = uuid();
      await qr.query(
        'INSERT INTO colors (id, name, hex_code, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
        [id, c.name, c.hexCode],
      );
      colorMap.set(c.name, id);
    }
    console.log(`✅ Tạo ${COLORS.length} colors!`);

    // ========== 3. TẠO SIZES ==========
    console.log('\n📦 Tạo sizes...');
    const sizeMap = new Map<string, string>();
    const allSizes = [...new Set([...SIZES_PHONE_STORAGE, ...SIZES_LAPTOP_RAM, ...SIZES_TABLET_STORAGE])];
    for (const s of allSizes) {
      const id = uuid();
      await qr.query(
        'INSERT INTO sizes (id, name, description, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
        [id, s, `Dung lượng/Cấu hình: ${s}`],
      );
      sizeMap.set(s, id);
    }
    console.log(`✅ Tạo ${allSizes.length} sizes!`);

    // ========== 4. TẠO BRANDS ==========
    console.log('\n🏷️  Tạo brands...');
    const brandMap = new Map<string, string>();
    for (const b of BRANDS) {
      const id = uuid();
      await qr.query(
        'INSERT INTO brands (id, name, description, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
        [id, b.name, b.description],
      );
      brandMap.set(b.name, id);
    }
    console.log(`✅ Tạo ${BRANDS.length} brands!`);

    // ========== 5. TẠO CATEGORIES ==========
    console.log('\n📁 Tạo categories...');
    const categoryMap = new Map<string, string>();
    // Tạo parent category trước
    const parentCat = CATEGORIES.find(c => !c.parentName)!;
    const parentId = uuid();
    await qr.query(
      'INSERT INTO categories (id, name, description, parent_id, created_at, updated_at) VALUES (?, ?, ?, NULL, NOW(), NOW())',
      [parentId, parentCat.name, parentCat.description],
    );
    categoryMap.set(parentCat.name, parentId);

    // Tạo sub-categories
    for (const c of CATEGORIES.filter(x => x.parentName)) {
      const id = uuid();
      const parentCatId = categoryMap.get(c.parentName!) || null;
      await qr.query(
        'INSERT INTO categories (id, name, description, parent_id, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [id, c.name, c.description, parentCatId],
      );
      categoryMap.set(c.name, id);
    }
    console.log(`✅ Tạo ${CATEGORIES.length} categories!`);

    // ========== 6. TẠO COUPONS ==========
    console.log('\n🎟️  Tạo coupons...');
    for (const c of COUPON_DATA) {
      const now_date = new Date();
      const startDate = new Date(now_date);
      const endDate = new Date(now_date);
      endDate.setMonth(endDate.getMonth() + 3);

      await qr.query(
        `INSERT INTO coupons (id, code, name, description, discountType, discountValue, minOrderAmount, maxDiscountAmount, startDate, endDate, usageLimit, usedCount, usageLimitPerUser, status, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'ACTIVE', NOW(), NOW())`,
        [
          uuid(), c.code, c.name, c.description, c.discountType,
          c.discountValue, c.minOrderAmount || 0, c.maxDiscountAmount || null,
          startDate, endDate, c.usageLimit, c.usageLimitPerUser,
        ],
      );
    }
    console.log(`✅ Tạo ${COUPON_DATA.length} coupons!`);

    // ========== 7. TẠO PRODUCTS + VARIANTS + IMAGES + REVIEWS ==========
    console.log('\n📱 Tạo products...');
    
    // Lấy admin user để tạo reviews
    const adminUsers = await qr.query('SELECT id FROM users LIMIT 5');
    const userIds = adminUsers.map((u: any) => u.id);

    let totalProducts = 0;
    let totalVariants = 0;
    let totalImages = 0;
    let totalReviews = 0;

    const allProducts = [...PHONES, ...TABLETS, ...LAPTOPS];

    for (const p of allProducts) {
      const productId = uuid();
      const categoryId = categoryMap.get(p.categoryName)!;
      const brandId = brandMap.get(p.brandName);

      // Tính giá sau giảm
      const finalPrice = p.discount ? p.price * (1 - p.discount / 100) : p.price;

      await qr.query(
        `INSERT INTO products (id, name, description, price, cost_price, brand, brand_id, category_id, status, hasVariants, stock, image, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', TRUE, ?, ?, NOW(), NOW())`,
        [productId, p.name, p.description, finalPrice, p.costPrice, p.brandName, brandId || null, categoryId, p.stock, p.image],
      );
      totalProducts++;

      // Tạo product_images
      for (let i = 0; i < p.images.length; i++) {
        await qr.query(
          'INSERT INTO product_images (id, product_id, variant_id, image_url, is_main, created_at, updated_at) VALUES (?, ?, NULL, ?, ?, NOW(), NOW())',
          [uuid(), productId, p.images[i], i === 0],
        );
        totalImages++;
      }

      // Tạo product_variants (color x size combinations)
      for (const colorName of p.colors) {
        const colorId = colorMap.get(colorName);
        if (!colorId) continue;

        for (const sizeName of p.sizes) {
          const sizeId = sizeMap.get(sizeName);
          const stockQty = randomInt(5, 30);
          const priceOverride = null; // dùng giá product

          await qr.query(
            `INSERT INTO product_variants (id, product_id, color_id, size_id, stock_quantity, price_override, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [uuid(), productId, colorId, sizeId || null, stockQty, priceOverride],
          );
          totalVariants++;
        }
      }

      // Tạo reviews nếu có user và có reviewCount
      if (userIds.length > 0 && p.reviewCount > 0) {
        const reviewComments = p.categoryName === 'Điện Thoại' ? REVIEW_COMMENTS.phone
          : p.categoryName === 'Tablet' ? REVIEW_COMMENTS.tablet
          : REVIEW_COMMENTS.laptop;

        const reviewsToCreate = Math.min(p.reviewCount, Math.min(userIds.length * 2, 8));
        const ratings = generateRatings(reviewsToCreate, p.avgRating);

        for (let i = 0; i < reviewsToCreate; i++) {
          const userId = userIds[i % userIds.length];
          const comment = reviewComments[i % reviewComments.length];
          const rating = ratings[i];

          await qr.query(
            `INSERT INTO reviews (id, user_id, product_id, rating, comment, status, reply, reply_date, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 'approved', NULL, NULL, DATE_SUB(NOW(), INTERVAL FLOOR(RAND()*30) DAY), NOW())`,
            [uuid(), userId, productId, rating, comment],
          );
          totalReviews++;
        }
      }

      process.stdout.write(`\r  ✅ [${totalProducts}/${allProducts.length}] ${p.name.substring(0, 40)}`);
    }

    console.log(`\n\n✅ Hoàn thành tạo sản phẩm!`);

    await qr.commitTransaction();

    console.log('\n' + '='.repeat(60));
    console.log('🎉 SEED HOÀN THÀNH!');
    console.log('='.repeat(60));
    console.log(`📦 Sản phẩm:     ${totalProducts} (Điện thoại: 15, Tablet: 15, Laptop: 15)`);
    console.log(`🔀 Biến thể:     ${totalVariants}`);
    console.log(`🖼️  Ảnh:          ${totalImages}`);
    console.log(`⭐ Đánh giá:     ${totalReviews}`);
    console.log(`🎟️  Coupon:       ${COUPON_DATA.length}`);
    console.log(`🏷️  Brand:        ${BRANDS.length}`);
    console.log(`🎨 Color:        ${COLORS.length}`);
    console.log(`📦 Size:         ${allSizes.length}`);
    console.log('='.repeat(60));

  } catch (err) {
    await qr.rollbackTransaction();
    console.error('\n❌ LỖI - Đã rollback transaction!', err);
    throw err;
  } finally {
    await qr.release();
    await AppDataSource.destroy();
  }
}

function generateRatings(count: number, avgRating: number): number[] {
  const ratings: number[] = [];
  for (let i = 0; i < count; i++) {
    const variation = (Math.random() - 0.5) * 1.5;
    const r = Math.round(Math.max(3, Math.min(5, avgRating + variation)));
    ratings.push(r);
  }
  return ratings;
}

seed().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
