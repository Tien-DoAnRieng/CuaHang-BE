export interface ProductSeedItem {
  name: string;
  category: string;
  brand: string;
  price: number;
  costPrice?: number;
  description: string;
  image: string;
  images?: string[];
  colors?: string[];
  sizes?: string[];
  priceOverrideMap?: Record<string, number>;
  stock?: number;
  customReviews?: string[];
}

export const PRODUCTS_CATALOG: ProductSeedItem[] = [
  // ==========================================
  // 1. ĐIỆN THOẠI (15 sản phẩm)
  // ==========================================
  {
    name: 'iPhone 16 Pro Max 256GB',
    category: 'Điện Thoại',
    brand: 'Apple',
    price: 34990000,
    description: 'iPhone 16 Pro Max với khung Titan cấp 5, nút Camera Control thế hệ mới và chip A18 Pro mạnh mẽ vượt trội. Màn hình Super Retina XDR 6.9 inch siêu mỏng, thời lượng pin tốt nhất từng có trên iPhone.',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80'
    ],
    colors: ['Titan Tự Nhiên', 'Xám Titan', 'Trắng', 'Đen'],
    sizes: ['256GB', '512GB', '1TB'],
    priceOverrideMap: { '256GB': 34990000, '512GB': 40990000, '1TB': 46990000 },
    customReviews: ['Máy siêu đẹp, cầm đầm tay, camera zoom 5x chụp cực nét.', 'Pin trâu khủng khiếp, dùng 2 ngày mới phải sạc lại. Rất đáng tiền!']
  },
  {
    name: 'Samsung Galaxy S25 Ultra 5G',
    category: 'Điện Thoại',
    brand: 'Samsung',
    price: 33990000,
    description: 'Galaxy S25 Ultra với quyền năng Galaxy AI thế hệ mới, khung viền Titan bo cong mềm mại, bút S Pen tích hợp và camera 200MP đột phá sắc nét trong mọi điều kiện ánh sáng.',
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80',
      'https://images.unsplash.com/photo-1583573636246-18cb2246697f?w=800&q=80'
    ],
    colors: ['Xám Titan', 'Đen', 'Bạc', 'Xanh Dương'],
    sizes: ['256GB', '512GB', '1TB'],
    priceOverrideMap: { '256GB': 33990000, '512GB': 37990000, '1TB': 44990000 }
  },
  {
    name: 'Google Pixel 9 Pro XL',
    category: 'Điện Thoại',
    brand: 'Google',
    price: 26990000,
    description: 'Google Pixel 9 Pro XL - điện thoại AI thuần túy nhất với chip Tensor G4. Camera 50MP + 48MP telephoto, Magic Eraser, Best Take và tính năng Add Me độc quyền.',
    image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&q=80',
    colors: ['Đen', 'Trắng', 'Xám Titan', 'Hồng Pastel'],
    sizes: ['128GB', '256GB', '512GB']
  },
  {
    name: 'Xiaomi 15 Pro Leica Optical',
    category: 'Điện Thoại',
    brand: 'Xiaomi',
    price: 22490000,
    description: 'Xiaomi 15 Pro trang bị chip Snapdragon 8 Elite, ống kính quang học Leica thế hệ mới, màn hình 2K 120Hz mượt mà cùng viên pin khủng 6100mAh hỗ trợ sạc siêu nhanh 90W.',
    image: 'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=800&q=80',
    colors: ['Đen', 'Trắng', 'Xanh Rêu', 'Bạc'],
    sizes: ['256GB', '512GB']
  },
  {
    name: 'OnePlus 13 Hasselblad Camera',
    category: 'Điện Thoại',
    brand: 'OnePlus',
    price: 21990000,
    description: 'OnePlus 13 mang lại hiệu năng gaming đỉnh cao với Snapdragon 8 Elite, hệ thống camera tinh chỉnh bởi Hasselblad và màn hình 2K Oriental Display rực rỡ.',
    image: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80',
    colors: ['Đen', 'Trắng', 'Xanh Dương'],
    sizes: ['256GB', '512GB']
  },
  {
    name: 'iPhone 16 128GB Dynamic Island',
    category: 'Điện Thoại',
    brand: 'Apple',
    price: 22490000,
    description: 'iPhone 16 tiêu chuẩn với nút Action Button, Camera Control, cụm camera kép xếp dọc hỗ trợ quay Spatial Video cho kính Apple Vision Pro.',
    image: 'https://images.unsplash.com/photo-1575695342320-d2d2d2f9b73f?w=800&q=80',
    colors: ['Đen', 'Trắng', 'Hồng Pastel', 'Xanh Mint', 'Xanh Dương'],
    sizes: ['128GB', '256GB', '512GB']
  },
  {
    name: 'Samsung Galaxy Z Fold6 5G',
    category: 'Điện Thoại',
    brand: 'Samsung',
    price: 43990000,
    description: 'Galaxy Z Fold6 - thiết kế mỏng nhẹ đẳng cấp, màn hình gập 7.6 inch siêu sáng 2600 nits, trải nghiệm đa nhiệm đỉnh cao cùng sức mạnh Galaxy AI vượt bậc.',
    image: 'https://images.unsplash.com/photo-1584006682522-dc17d6c0d963?w=800&q=80',
    colors: ['Bạc', 'Xanh Navy', 'Đen', 'Hồng Pastel'],
    sizes: ['256GB', '512GB', '1TB']
  },
  {
    name: 'Samsung Galaxy Z Flip6 5G',
    category: 'Điện Thoại',
    brand: 'Samsung',
    price: 28990000,
    description: 'Galaxy Z Flip6 gập mở phong cách, màn hình ngoài Flex Window 3.4 inch độc đáo, camera 50MP nâng cấp vượt bậc cùng pin 4000mAh bền bỉ.',
    image: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&q=80',
    colors: ['Xanh Mint', 'Vàng Gold', 'Xám Titan', 'Đen'],
    sizes: ['256GB', '512GB']
  },
  {
    name: 'OPPO Find X8 Pro Hasselblad',
    category: 'Điện Thoại',
    brand: 'OPPO',
    price: 22990000,
    description: 'OPPO Find X8 Pro với hệ thống camera tele tiềm vọng kép đầu tiên, chip Dimensity 9400 tiến trình 3nm và viên pin Silicon-Carbon 5910mAh cực bền.',
    image: 'https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=800&q=80',
    colors: ['Đen', 'Trắng', 'Xanh Dương'],
    sizes: ['256GB', '512GB']
  },
  {
    name: 'Vivo X200 Pro ZEISS Camera',
    category: 'Điện Thoại',
    brand: 'Vivo',
    price: 23990000,
    description: 'Vivo X200 Pro sở hữu cảm biến camera 200MP ZEISS APO telephoto, chip Dimensity 9400 và khả năng chụp chân dung phong cảnh hàng đầu thế giới smartphone.',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80',
    colors: ['Đen', 'Trắng', 'Xanh Titan'],
    sizes: ['256GB', '512GB']
  },
  {
    name: 'Sony Xperia 1 VI 4K OLED',
    category: 'Điện Thoại',
    brand: 'Sony',
    price: 29990000,
    description: 'Sony Xperia 1 VI dành cho người yêu nhiếp ảnh và âm thanh chuyên nghiệp. Ống kính zoom quang học thực 85-170mm và màn hình OLED Bravia sắc nét.',
    image: 'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=800&q=80',
    colors: ['Đen', 'Bạc', 'Xanh Rêu'],
    sizes: ['256GB', '512GB']
  },
  {
    name: 'iPhone 15 Pro Max 256GB Titan',
    category: 'Điện Thoại',
    brand: 'Apple',
    price: 29490000,
    description: 'iPhone 15 Pro Max với chip A17 Pro 3nm, ống kính telephoto 5x và khung viền Titan siêu nhẹ, nút Action Button tùy biến linh hoạt.',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
    colors: ['Titan Tự Nhiên', 'Xanh Navy', 'Đen', 'Trắng'],
    sizes: ['256GB', '512GB', '1TB']
  },
  {
    name: 'Xiaomi Redmi Note 14 Pro+ 5G',
    category: 'Điện Thoại',
    brand: 'Xiaomi',
    price: 9490000,
    description: 'Vua phân khúc tầm trung với chuẩn kháng nước IP68/IP69K, camera 200MP chống rung OIS, sạc nhanh 120W và màn hình cong AMOLED 1.5K 120Hz.',
    image: 'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=800&q=80',
    colors: ['Đen', 'Xanh Mint', 'Tím Lavender'],
    sizes: ['256GB', '512GB']
  },
  {
    name: 'Samsung Galaxy A55 5G Metal',
    category: 'Điện Thoại',
    brand: 'Samsung',
    price: 9890000,
    description: 'Galaxy A55 5G với khung viền kim loại cao cấp, mặt lưng kính Gorilla Glass Victus+, camera Nightography 50MP và bảo mật Knox Vault.',
    image: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&q=80',
    colors: ['Xanh Navy', 'Tím Lavender', 'Vàng Gold', 'Đen'],
    sizes: ['128GB', '256GB']
  },
  {
    name: 'Google Pixel 8a AI Phone',
    category: 'Điện Thoại',
    brand: 'Google',
    price: 11990000,
    description: 'Google Pixel 8a mang trọn vẹn trải nghiệm Google AI cao cấp với chip Tensor G3, camera chụp chân dung xuất sắc và 7 năm cập nhật phần mềm.',
    image: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&q=80',
    colors: ['Xanh Dương', 'Đen', 'Trắng', 'Hồng Pastel'],
    sizes: ['128GB', '256GB']
  },

  // ==========================================
  // 2. TABLET (15 sản phẩm)
  // ==========================================
  {
    name: 'iPad Pro M4 13 inch Ultra Retina XDR',
    category: 'Tablet',
    brand: 'Apple',
    price: 37990000,
    description: 'iPad Pro M4 với thiết kế siêu mỏng 5.1mm mỏng nhất lịch sử Apple. Màn hình Tandem OLED Ultra Retina XDR siêu sáng 1600 nits, chip M4 xử lý AI vượt trội.',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80',
    colors: ['Bạc', 'Đen'],
    sizes: ['256GB', '512GB', '1TB'],
    priceOverrideMap: { '256GB': 37990000, '512GB': 43990000, '1TB': 55990000 }
  },
  {
    name: 'Samsung Galaxy Tab S10 Ultra 5G',
    category: 'Tablet',
    brand: 'Samsung',
    price: 33990000,
    description: 'Galaxy Tab S10 Ultra màn hình cực đại Dynamic AMOLED 2X 14.6 inch chống chói, chip Dimensity 9300+ 4nm, kèm bút S Pen tích hợp công nghệ Galaxy AI vẽ thông minh.',
    image: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&q=80',
    colors: ['Xám Titan', 'Bạc'],
    sizes: ['256GB', '512GB', '1TB']
  },
  {
    name: 'iPad Air M2 13 inch Liquid Retina',
    category: 'Tablet',
    brand: 'Apple',
    price: 22990000,
    description: 'iPad Air M2 kích thước 13 inch hoàn toàn mới, trang bị chip M2 mạnh mẽ, hỗ trợ Apple Pencil Pro và Magic Keyboard cho hiệu suất học tập và làm việc đỉnh cao.',
    image: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=800&q=80',
    colors: ['Xanh Dương', 'Tím Lavender', 'Bạc', 'Xám Titan'],
    sizes: ['128GB', '256GB', '512GB']
  },
  {
    name: 'Xiaomi Pad 7 Pro 3.2K 144Hz',
    category: 'Tablet',
    brand: 'Xiaomi',
    price: 10490000,
    description: 'Xiaomi Pad 7 Pro sở hữu màn hình tỷ lệ 3:2 chuẩn văn phòng, độ phân giải 3.2K 144Hz mượt mà, chip Snapdragon 8s Gen 3 và sạc siêu nhanh 67W.',
    image: 'https://images.unsplash.com/photo-1527698266440-12104e498b76?w=800&q=80',
    colors: ['Đen', 'Xanh Mint', 'Bạc'],
    sizes: ['128GB', '256GB', '512GB']
  },
  {
    name: 'iPad Mini A17 Pro Compact',
    category: 'Tablet',
    brand: 'Apple',
    price: 14790000,
    description: 'iPad mini mới với chip A17 Pro, hỗ trợ Apple Intelligence và Apple Pencil Pro. Thiết kế nhỏ gọn 8.3 inch vừa vặn lòng bàn tay tiện lợi di chuyển.',
    image: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=800&q=80',
    colors: ['Xanh Dương', 'Tím Lavender', 'Bạc', 'Xám Titan'],
    sizes: ['128GB', '256GB', '512GB']
  },
  {
    name: 'Samsung Galaxy Tab S10+ 12.4 inch',
    category: 'Tablet',
    brand: 'Samsung',
    price: 25990000,
    description: 'Màn hình Dynamic AMOLED 2X 12.4 inch, chuẩn kháng nước IP68 cho cả máy và bút S Pen, hỗ trợ Samsung DeX chuyển đổi giao diện máy tính trong tích tắc.',
    image: 'https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?w=800&q=80',
    colors: ['Xám Titan', 'Bạc'],
    sizes: ['256GB', '512GB']
  },
  {
    name: 'Lenovo Tab P12 Pro OLED 120Hz',
    category: 'Tablet',
    brand: 'Lenovo',
    price: 13990000,
    description: 'Máy tính bảng giải trí cao cấp với 4 loa JBL công nghệ Dolby Atmos, màn hình AMOLED 2K HDR10+ và bút Precision Pen 3 sạc không dây từ tính.',
    image: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&q=80',
    colors: ['Xám Titan', 'Bạc'],
    sizes: ['128GB', '256GB']
  },
  {
    name: 'OPPO Pad 3 Pro 3K 144Hz',
    category: 'Tablet',
    brand: 'OPPO',
    price: 17990000,
    description: 'OPPO Pad 3 Pro trang bị Snapdragon 8 Gen 3 Leading Edition, 8 loa âm thanh vòm toàn cảnh và màn hình hiển thị 3K 144Hz sắc nét.',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80',
    colors: ['Đen', 'Vàng Gold'],
    sizes: ['256GB', '512GB']
  },
  {
    name: 'iPad 10th Gen 10.9 inch Colorful',
    category: 'Tablet',
    brand: 'Apple',
    price: 9890000,
    description: 'iPad Gen 10 thiết kế toàn màn hình rực rỡ, cổng sạc USB-C hiện đại, camera trước góc siêu rộng Center Stage ngang hỗ trợ gọi video hoàn hảo.',
    image: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=800&q=80',
    colors: ['Xanh Dương', 'Hồng Pastel', 'Vàng Gold', 'Bạc'],
    sizes: ['64GB WiFi', '256GB WiFi']
  },
  {
    name: 'Samsung Galaxy Tab S9 FE Water Resistant',
    category: 'Tablet',
    brand: 'Samsung',
    price: 9990000,
    description: 'Tablet học tập sáng tạo bền bỉ với chuẩn kháng nước bụi IP68, màn hình 10.9 inch 90Hz mượt mà và bút S Pen tặng kèm trong hộp.',
    image: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=800&q=80',
    colors: ['Xanh Mint', 'Xám Titan', 'Bạc', 'Tím Lavender'],
    sizes: ['128GB', '256GB']
  },
  {
    name: 'Vivo Pad 3 Pro 3.1K Display',
    category: 'Tablet',
    brand: 'Vivo',
    price: 15490000,
    description: 'Màn hình 13 inch 3.1K 144Hz siêu sắc nét, chip Dimensity 9300 mạnh mẽ, pin 11500mAh cho thời lượng sử dụng liên tục lên đến 15 giờ.',
    image: 'https://images.unsplash.com/photo-1527698266440-12104e498b76?w=800&q=80',
    colors: ['Bạc', 'Xám Titan', 'Xanh Dương'],
    sizes: ['256GB', '512GB']
  },
  {
    name: 'Samsung Galaxy Tab A9+ 11 inch',
    category: 'Tablet',
    brand: 'Samsung',
    price: 5490000,
    description: 'Máy tính bảng gia đình giá tốt với màn hình 11 inch 90Hz rộng rãi, hệ thống 4 loa Dolby Atmos sống động và khả năng chia 3 màn hình đa nhiệm.',
    image: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&q=80',
    colors: ['Bạc', 'Xanh Navy', 'Đen'],
    sizes: ['64GB WiFi', '128GB WiFi']
  },
  {
    name: 'iPad Pro M4 11 inch Tandem OLED',
    category: 'Tablet',
    brand: 'Apple',
    price: 28990000,
    description: 'Phiên bản iPad Pro M4 11 inch siêu gọn nhẹ, màn hình OLED Tandem tuyệt đẹp, hiệu năng render 3D và dựng phim 4K không đối thủ.',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80',
    colors: ['Bạc', 'Đen'],
    sizes: ['256GB', '512GB', '1TB']
  },
  {
    name: 'Google Pixel Tablet with Speaker Dock',
    category: 'Tablet',
    brand: 'Google',
    price: 13990000,
    description: 'Tablet 2-trong-1 đi kèm dock sạc kiêm loa thông minh. Tích hợp chip Tensor G2, điều khiển nhà thông minh và hiển thị ảnh kỷ niệm gia đình.',
    image: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=800&q=80',
    colors: ['Trắng', 'Xám Titan', 'Hồng Pastel'],
    sizes: ['128GB', '256GB']
  },
  {
    name: 'Lenovo Yoga Tab 13 Stand Tablet',
    category: 'Tablet',
    brand: 'Lenovo',
    price: 14990000,
    description: 'Thiết kế chân đế kim loại độc đáo có thể treo hoặc dựng mọi tư thế, màn hình 2K Dolby Vision và cổng micro-HDMI biến tablet thành màn hình phụ di động.',
    image: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=800&q=80',
    colors: ['Đen', 'Bạc'],
    sizes: ['128GB', '256GB']
  },

  // ==========================================
  // 3. LAPTOP & PC (15 sản phẩm)
  // ==========================================
  {
    name: 'MacBook Pro M4 Max 16 inch 36GB/1TB',
    category: 'Laptop & PC',
    brand: 'Apple',
    price: 89990000,
    description: 'Quái vật hiệu năng cho lập trình viên và nhà làm phim chuyên nghiệp. Chip Apple M4 Max 14-core CPU 32-core GPU, màn hình Liquid Retina XDR 120Hz đỉnh cao.',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    colors: ['Đen', 'Bạc'],
    sizes: ['16GB RAM / 512GB SSD', '32GB RAM / 1TB SSD', '64GB RAM / 2TB SSD'],
    priceOverrideMap: { '16GB RAM / 512GB SSD': 89990000, '32GB RAM / 1TB SSD': 99990000, '64GB RAM / 2TB SSD': 119990000 }
  },
  {
    name: 'Dell XPS 16 9640 Core Ultra 9 RTX 4070',
    category: 'Laptop & PC',
    brand: 'Dell',
    price: 69990000,
    description: 'Kiệt tác thiết kế nhôm nguyên khối CNC, bàn di chuột tàng hình bằng kính, màn hình cảm ứng 4K OLED vô cực cùng card đồ họa NVIDIA RTX 4070.',
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&q=80',
    colors: ['Bạc', 'Xám Titan'],
    sizes: ['16GB RAM / 512GB SSD', '32GB RAM / 1TB SSD']
  },
  {
    name: 'ASUS ROG Zephyrus G16 OLED RTX 4080',
    category: 'Laptop & PC',
    brand: 'ASUS',
    price: 66490000,
    description: 'Laptop gaming mỏng nhẹ cao cấp khung nhôm CNC, màn hình ROG Nebula OLED 2.5K 240Hz chuẩn màu 100% DCI-P3, dải đèn Slash Lighting độc bản.',
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&q=80',
    colors: ['Đen', 'Trắng'],
    sizes: ['16GB RAM / 512GB SSD', '32GB RAM / 1TB SSD']
  },
  {
    name: 'MacBook Air M3 15 inch Siêu Mỏng',
    category: 'Laptop & PC',
    brand: 'Apple',
    price: 32990000,
    description: 'MacBook Air 15 inch với sức mạnh chip M3, thời lượng pin 18 tiếng liên tục, thiết kế nhôm nguyên khối không quạt vận hành hoàn toàn êm ái.',
    image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80',
    colors: ['Đen', 'Bạc', 'Trắng', 'Titan Tự Nhiên'],
    sizes: ['16GB RAM / 512GB SSD', '32GB RAM / 1TB SSD']
  },
  {
    name: 'Lenovo ThinkPad X1 Carbon Gen 12',
    category: 'Laptop & PC',
    brand: 'Lenovo',
    price: 45990000,
    description: 'Biểu tượng laptop doanh nhân cao cấp bằng sợi carbon siêu nhẹ 1.09kg, bàn phím gõ êm nhất thế giới, bảo mật cấp doanh nghiệp ThinkShield.',
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80',
    colors: ['Đen'],
    sizes: ['16GB RAM / 512GB SSD', '32GB RAM / 1TB SSD']
  },
  {
    name: 'HP Spectre x360 14 2-in-1 OLED',
    category: 'Laptop & PC',
    brand: 'HP',
    price: 42990000,
    description: 'Laptop xoay gập 360 độ cao cấp với các góc vát kim cương tinh xảo, màn hình cảm ứng 2.8K OLED 120Hz và webcam AI 9MP tự động căn khung hình.',
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&q=80',
    colors: ['Đen', 'Bạc', 'Xanh Navy'],
    sizes: ['16GB RAM / 512GB SSD', '32GB RAM / 1TB SSD']
  },
  {
    name: 'MSI Titan 18 HX Dragon Edition RTX 4090',
    category: 'Laptop & PC',
    brand: 'MSI',
    price: 119990000,
    description: 'Trùm cuối laptop gaming thế giới. Chip Intel Core i9-14900HX, GPU RTX 4090 175W, màn hình Mini-LED 4K 120Hz và bàn phím cơ Cherry MX.',
    image: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&q=80',
    colors: ['Đen'],
    sizes: ['32GB RAM / 1TB SSD', '64GB RAM / 2TB SSD']
  },
  {
    name: 'Acer Predator Helios 16 RTX 4070',
    category: 'Laptop & PC',
    brand: 'Acer',
    price: 43990000,
    description: 'Laptop chiến game đỉnh cao với công nghệ tản nhiệt kim loại lỏng AeroBlade 3D thế hệ 5, màn hình WQXGA 240Hz siêu mượt và dải LED RGB cá tính.',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
    colors: ['Đen'],
    sizes: ['16GB RAM / 512GB SSD', '32GB RAM / 1TB SSD']
  },
  {
    name: 'ASUS Zenbook Duo 2 Màn Hình OLED',
    category: 'Laptop & PC',
    brand: 'ASUS',
    price: 48990000,
    description: 'Laptop 2 màn hình cảm ứng 14 inch 3K OLED 120Hz đột phá, bàn phím Bluetooth tháo rời tiện lợi mang lại không gian làm việc đa nhiệm không giới hạn.',
    image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&q=80',
    colors: ['Xám Titan'],
    sizes: ['16GB RAM / 512GB SSD', '32GB RAM / 1TB SSD']
  },
  {
    name: 'Lenovo Legion Pro 7i Core i9 RTX 4080',
    category: 'Laptop & PC',
    brand: 'Lenovo',
    price: 62990000,
    description: 'Cỗ máy gaming hoàn hảo tối ưu bởi chip AI Lenovo LA2-Q, tản nhiệt buồng hơi Legion Coldfront 5.0 và màn hình PureSight Gaming 240Hz 500 nits.',
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80',
    colors: ['Xám Titan'],
    sizes: ['16GB RAM / 512GB SSD', '32GB RAM / 1TB SSD']
  },
  {
    name: 'Dell Inspiron 14 Plus Intel Core Ultra 7',
    category: 'Laptop & PC',
    brand: 'Dell',
    price: 24990000,
    description: 'Laptop văn phòng mỏng nhẹ hiệu năng cao trang bị NPU xử lý AI, màn hình tỷ lệ 16:10 sắc nét, pin dùng trọn ngày làm việc.',
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&q=80',
    colors: ['Bạc', 'Xanh Mint'],
    sizes: ['16GB RAM / 512GB SSD', '32GB RAM / 1TB SSD']
  },
  {
    name: 'HP Omen 16 Gaming RTX 4060',
    category: 'Laptop & PC',
    brand: 'HP',
    price: 34990000,
    description: 'Laptop gaming thanh lịch với hiệu năng vượt trội từ card RTX 4060, âm thanh tinh chỉnh bởi Bang & Olufsen và phần mềm OMEN Gaming Hub.',
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&q=80',
    colors: ['Đen', 'Trắng'],
    sizes: ['16GB RAM / 512GB SSD', '32GB RAM / 1TB SSD']
  },
  {
    name: 'MacBook Air M2 13.6 inch Nhẹ 1.24kg',
    category: 'Laptop & PC',
    brand: 'Apple',
    price: 24490000,
    description: 'Thiết kế phẳng siêu mỏng nhẹ thời trang, sạc MagSafe 3 an toàn, camera 1080p FaceTime HD và màn hình Liquid Retina 500 nits rực rỡ.',
    image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80',
    colors: ['Đen', 'Bạc', 'Trắng', 'Titan Tự Nhiên'],
    sizes: ['16GB RAM / 512GB SSD']
  },
  {
    name: 'Acer Swift Go 14 AI OLED 2.8K',
    category: 'Laptop & PC',
    brand: 'Acer',
    price: 21990000,
    description: 'Laptop chuẩn Intel Evo siêu nhẹ, màn hình 14 inch 2.8K OLED 90Hz rực rỡ chuẩn màu 100% DCI-P3, tích hợp phím Copilot AI khởi động nhanh.',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
    colors: ['Bạc', 'Hồng Pastel'],
    sizes: ['16GB RAM / 512GB SSD']
  },
  {
    name: 'PC All-in-One Apple iMac 24 inch M4',
    category: 'Laptop & PC',
    brand: 'Apple',
    price: 39990000,
    description: 'Máy tính để bàn tất cả trong một siêu mỏng 11.5mm, màn hình Retina 4.5K 24 inch sắc nét, camera 12MP Center Stage và 6 loa hỗ trợ Spatial Audio.',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80',
    colors: ['Xanh Dương', 'Xanh Mint', 'Hồng Pastel', 'Bạc'],
    sizes: ['16GB RAM / 512GB SSD', '32GB RAM / 1TB SSD']
  },

  // ==========================================
  // 4. THỜI TRANG NAM (15 sản phẩm)
  // ==========================================
  {
    name: 'Áo Polo Nam Uniqlo Dry-EX Thấm Hút Mồ Hôi',
    category: 'Thời trang Nam',
    brand: 'Uniqlo',
    price: 490000,
    description: 'Áo polo nam công nghệ Dry-EX độc quyền Uniqlo giúp vải khô tức thì, thoáng khí tối đa, form dáng chuẩn công sở lẫn thể thao thường ngày.',
    image: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&q=80',
    colors: ['Đen', 'Trắng', 'Xanh Navy', 'Xám Titan'],
    sizes: ['Size S', 'Size M', 'Size L', 'Size XL', 'Size XXL'],
    customReviews: ['Vải mặc mát rượi, không nhăn khi giặt máy, form lên rất đẹp.', 'Đã mua 3 cái mặc đi làm hàng ngày, rất ưng ý!']
  },
  {
    name: 'Áo Thun Nam Nike Sportswear Club Tee Cotton',
    category: 'Thời trang Nam',
    brand: 'Nike',
    price: 690000,
    description: 'Áo thun thể thao nam Nike 100% cotton chải kỹ mềm mịn, logo thêu tinh tế trước ngực, mang lại cảm giác thoải mái suốt ngày dài.',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
    colors: ['Đen', 'Trắng', 'Xám Titan', 'Đỏ Ruby'],
    sizes: ['Size S', 'Size M', 'Size L', 'Size XL', 'Size XXL']
  },
  {
    name: 'Quần Jean Nam Levi’s 511 Slim Fit Co Giãn',
    category: 'Thời trang Nam',
    brand: 'Levi’s',
    price: 1690000,
    description: 'Quần bò nam Levi’s 511 phom dáng ôm vừa vặn hiện đại, chất vải denim pha sợi co giãn thoải mái khi vận động cả ngày.',
    image: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=800&q=80',
    colors: ['Xanh Navy', 'Xanh Dương', 'Đen'],
    sizes: ['Size S', 'Size M', 'Size L', 'Size XL']
  },
  {
    name: 'Áo Sơ Mi Nam Công Sở Zara Oxford Slim Fit',
    category: 'Thời trang Nam',
    brand: 'Zara',
    price: 890000,
    description: 'Áo sơ mi Oxford nam phong cách châu Âu, chất liệu cotton thoáng mát, form tôn dáng chuẩn chỉ cho các buổi họp và sự kiện quan trọng.',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80',
    colors: ['Trắng', 'Xanh Dương', 'Hồng Pastel', 'Đen'],
    sizes: ['Size S', 'Size M', 'Size L', 'Size XL']
  },
  {
    name: 'Áo Khoác Gió Nam The North Face Chống Nước',
    category: 'Thời trang Nam',
    brand: 'Nike',
    price: 2450000,
    description: 'Áo khoác gió thể thao 2 lớp công nghệ kháng nước và cản gió tuyệt đối, thích hợp cho các chuyến phượt, chạy bộ mùa thu đông.',
    image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&q=80',
    colors: ['Đen', 'Xanh Navy', 'Xanh Rêu'],
    sizes: ['Size S', 'Size M', 'Size L', 'Size XL']
  },
  {
    name: 'Áo Hoodie Nam Adidas Essentials Fleece Logo',
    category: 'Thời trang Nam',
    brand: 'Adidas',
    price: 1290000,
    description: 'Áo nỉ có mũ Adidas chất vải nỉ bông dày dặn ấm áp, logo 3 lá kinh điển in nổi bật, phong cách streetwear trẻ trung.',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80',
    colors: ['Đen', 'Xám Titan', 'Xanh Navy'],
    sizes: ['Size M', 'Size L', 'Size XL', 'Size XXL']
  },
  {
    name: 'Quần Tây Nam Cao Cấp Calvin Klein Straight',
    category: 'Thời trang Nam',
    brand: 'Calvin Klein',
    price: 1890000,
    description: 'Quần âu nam Calvin Klein đường may may đo cao cấp, chất vải hạn chế nhăn nhúm, tôn lên nét nam tính lịch lãm của quý ông.',
    image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=800&q=80',
    colors: ['Đen', 'Xám Titan', 'Xanh Navy'],
    sizes: ['Size S', 'Size M', 'Size L', 'Size XL']
  },
  {
    name: 'Bộ Đồ Thể Thao Nam Adidas Tiro 24 Hút Ẩm',
    category: 'Thời trang Nam',
    brand: 'Adidas',
    price: 1750000,
    description: 'Set đồ tập thể thao nam chính hãng gồm áo khoác kéo khóa và quần bo gấu, công nghệ AEROREADY kiểm soát độ ẩm tối ưu.',
    image: 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=800&q=80',
    colors: ['Đen', 'Xanh Navy'],
    sizes: ['Size S', 'Size M', 'Size L', 'Size XL']
  },
  {
    name: 'Áo Khoác Da Biker Nam Zara Streetwear',
    category: 'Thời trang Nam',
    brand: 'Zara',
    price: 2790000,
    description: 'Áo khoác da nam phong cách biker cá tính, khóa kéo kim loại cao cấp, lớp lót êm ái chống lạnh cực tốt.',
    image: 'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=800&q=80',
    colors: ['Đen', 'Nâu Da Bò'],
    sizes: ['Size M', 'Size L', 'Size XL']
  },
  {
    name: 'Quần Short Kaki Nam Uniqlo Chino Thoáng Mát',
    category: 'Thời trang Nam',
    brand: 'Uniqlo',
    price: 590000,
    description: 'Quần sooc nam kaki co giãn nhẹ, chiều dài vừa trên gối năng động, dễ dàng phối cùng áo phông hoặc polo cho ngày hè.',
    image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&q=80',
    colors: ['Be / Nude', 'Xanh Navy', 'Đen', 'Xanh Rêu'],
    sizes: ['Size S', 'Size M', 'Size L', 'Size XL']
  },
  {
    name: 'Áo Blazer Nam Casual Uniqlo Kèm Đệm Vai',
    category: 'Thời trang Nam',
    brand: 'Uniqlo',
    price: 1790000,
    description: 'Áo vest nam dáng trẻ trung siêu nhẹ, co giãn thoải mái, không cần là ủi phức tạp, có thể giặt máy tại nhà.',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80',
    colors: ['Xanh Navy', 'Đen', 'Xám Titan'],
    sizes: ['Size S', 'Size M', 'Size L', 'Size XL']
  },
  {
    name: 'Áo Len Nam Cổ Tròn Tommy Hilfiger Cotton Silk',
    category: 'Thời trang Nam',
    brand: 'Calvin Klein',
    price: 2190000,
    description: 'Chất len pha lụa cao cấp mềm mịn không xù lông, viền cổ dệt sọc thể thao tinh tế đậm chất phong cách đại học Mỹ.',
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80',
    colors: ['Xanh Navy', 'Xám Titan', 'Đỏ Burgundy', 'Trắng'],
    sizes: ['Size S', 'Size M', 'Size L', 'Size XL']
  },
  {
    name: 'Quần Jogger Thể Thao Nam Nike Club Fleece',
    category: 'Thời trang Nam',
    brand: 'Nike',
    price: 1190000,
    description: 'Quần nỉ bo ống Nike chất vải mềm êm, cạp chun có dây rút tùy chỉnh, túi tiện dụng 2 bên hông để chìa khóa và điện thoại.',
    image: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&q=80',
    colors: ['Xám Titan', 'Đen', 'Xanh Navy'],
    sizes: ['Size S', 'Size M', 'Size L', 'Size XL']
  },
  {
    name: 'Áo Khoác Phao Nam Siêu Nhẹ Uniqlo Ultra Light',
    category: 'Thời trang Nam',
    brand: 'Uniqlo',
    price: 1590000,
    description: 'Áo phao lông vũ siêu nhẹ có thể gấp gọn trong túi nhỏ, khả năng giữ ấm tức thì và trượt nước nhẹ khi gặp mưa phùn.',
    image: 'https://images.unsplash.com/photo-1544923246-77307dd654cb?w=800&q=80',
    colors: ['Đen', 'Xanh Navy', 'Xanh Rêu', 'Xám Titan'],
    sizes: ['Size S', 'Size M', 'Size L', 'Size XL', 'Size XXL']
  },
  {
    name: 'Áo Sơ Mi Nam Đũi Cổ Tàu Thoáng Khí Hè',
    category: 'Thời trang Nam',
    brand: 'Zara',
    price: 650000,
    description: 'Áo sơ mi đũi nam cổ trụ mộc mạc, thấm hút mồ hôi cực đỉnh, phong cách thư thái lãng tử cho những buổi dạo phố cuối tuần.',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80',
    colors: ['Trắng', 'Be / Nude', 'Xanh Mint'],
    sizes: ['Size S', 'Size M', 'Size L', 'Size XL']
  },

  // ==========================================
  // 5. THỜI TRANG NỮ (15 sản phẩm)
  // ==========================================
  {
    name: 'Đầm Dạ Hội Lụa Satin Zara Dáng Dài Cut-Out',
    category: 'Thời trang Nữ',
    brand: 'Zara',
    price: 1490000,
    description: 'Đầm dạ hội nữ chất liệu satin bóng nhẹ cao cấp, thiết kế thắt eo tôn dáng và đường xẻ tà quyến rũ cho các buổi tiệc tối sang trọng.',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=80',
    colors: ['Đỏ Ruby', 'Đen', 'Hồng Pastel', 'Xanh Mint'],
    sizes: ['Size S', 'Size M', 'Size L'],
    customReviews: ['Váy mặc lên sang dã man, chất lụa mềm mướt không nhăn.', 'Mặc đi tiệc ai cũng khen dáng đẹp, chấm 10/10!']
  },
  {
    name: 'Áo Blazer Nữ Oversized Zara Classic',
    category: 'Thời trang Nữ',
    brand: 'Zara',
    price: 1690000,
    description: 'Áo vest blazer nữ phom rộng thanh lịch, đệm vai tinh tế tạo phom chuẩn Hàn Quốc, dễ phối đồ từ công sở đến dạo phố.',
    image: 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?w=800&q=80',
    colors: ['Be / Nude', 'Đen', 'Trắng', 'Xám Titan'],
    sizes: ['Size S', 'Size M', 'Size L', 'Size XL']
  },
  {
    name: 'Chân Váy Xếp Ly Dáng Chữ A Uniqlo Smart Pleated',
    category: 'Thời trang Nữ',
    brand: 'Uniqlo',
    price: 890000,
    description: 'Chân váy xếp ly cạp cao tôn dáng, chất vải giữ nếp hoàn hảo sau nhiều lần giặt, tạo nét dịu dàng nữ tính cho phái đẹp.',
    image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&q=80',
    colors: ['Trắng', 'Be / Nude', 'Đen', 'Tím Lavender'],
    sizes: ['Size S', 'Size M', 'Size L']
  },
  {
    name: 'Áo Kiểu Nữ Mango Voan Hoa Nhí Cổ V Điệu Đà',
    category: 'Thời trang Nữ',
    brand: 'Mango',
    price: 790000,
    description: 'Áo sơ mi voan nữ họa tiết hoa nhí vintage, tay bồng nhẹ nhàng và cổ V thanh thoát cho nàng công sở duyên dáng.',
    image: 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=800&q=80',
    colors: ['Hồng Pastel', 'Trắng', 'Xanh Mint'],
    sizes: ['Size S', 'Size M', 'Size L']
  },
  {
    name: 'Quần Jean Nữ Ống Loe Levi’s Ribcage High Rise',
    category: 'Thời trang Nữ',
    brand: 'Levi’s',
    price: 1650000,
    description: 'Quần bò nữ cạp siêu cao ôm trọn eo và tôn chân dài miên man, chất denim cao cấp nâng mông tự nhiên.',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80',
    colors: ['Xanh Dương', 'Xanh Navy', 'Đen'],
    sizes: ['Size S', 'Size M', 'Size L']
  },
  {
    name: 'Áo Cardigan Nữ Len Dệt Kim H&M Mềm Mại',
    category: 'Thời trang Nữ',
    brand: 'H&M',
    price: 650000,
    description: 'Áo khoác len mỏng nữ cài cúc ngọc trai ngọt ngào, chất sợi dệt kim co giãn êm ái thích hợp tiết trời se lạnh thu đông.',
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80',
    colors: ['Trắng', 'Hồng Pastel', 'Be / Nude', 'Tím Lavender'],
    sizes: ['Size S', 'Size M', 'Size L']
  },
  {
    name: 'Set Bộ Công Sở Nữ Áo Vest & Quần Tây Mango',
    category: 'Thời trang Nữ',
    brand: 'Mango',
    price: 2290000,
    description: 'Bộ vest nữ công sở hoàn hảo gồm áo blazer form chuẩn và quần tây đứng dáng, toát lên phong thái nữ lãnh đạo quyền lực.',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
    colors: ['Be / Nude', 'Đen', 'Trắng'],
    sizes: ['Size S', 'Size M', 'Size L']
  },
  {
    name: 'Đầm Babydoll Nữ Cổ Nơ Tiểu Thư Xinh Xắn',
    category: 'Thời trang Nữ',
    brand: 'Zara',
    price: 690000,
    description: 'Váy xòe nữ babydoll dáng rộng giấu khuyết điểm tốt, cổ áo phối nơ ngọt ngào, chất vải xốp tơ mềm mại nhẹ tênh.',
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80',
    colors: ['Trắng', 'Hồng Pastel', 'Vàng Gold'],
    sizes: ['Size S', 'Size M', 'Size L']
  },
  {
    name: 'Áo Khoác Dạ Tweed Nữ Sang Trọng Phong Cách Pháp',
    category: 'Thời trang Nữ',
    brand: 'Zara',
    price: 1890000,
    description: 'Áo khoác dạ tweed nữ dệt sợi kim tuyến lấp lánh, cúc kim loại mạ vàng sang trọng, chuẩn phong cách tiểu thư đài các.',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80',
    colors: ['Trắng', 'Đen', 'Hồng Pastel'],
    sizes: ['Size S', 'Size M', 'Size L']
  },
  {
    name: 'Đầm Suông Nữ Linen Uniqlo Mát Mịn Mùa Hè',
    category: 'Thời trang Nữ',
    brand: 'Uniqlo',
    price: 990000,
    description: 'Váy đầm chất liệu 100% linen tự nhiên thoáng mát, phom suông tối giản mang lại sự phóng khoáng và dễ chịu tối đa.',
    image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80',
    colors: ['Be / Nude', 'Xanh Mint', 'Trắng'],
    sizes: ['Size S', 'Size M', 'Size L', 'Size XL']
  },
  {
    name: 'Chân Váy Jean Nữ Xẻ Tà Cá Tính Form Chuẩn',
    category: 'Thời trang Nữ',
    brand: 'Levi’s',
    price: 750000,
    description: 'Chân váy bò midi xẻ trước sành điệu, tôn đường cong quyến rũ, chất vải denim dày dặn đứng phom cực kỳ hack dáng.',
    image: 'https://images.unsplash.com/photo-1582142306909-195724d33ffc?w=800&q=80',
    colors: ['Xanh Dương', 'Đen'],
    sizes: ['Size S', 'Size M', 'Size L']
  },
  {
    name: 'Áo Croptop Nữ Tay Dài Ôm Body Tôn Dáng',
    category: 'Thời trang Nữ',
    brand: 'H&M',
    price: 390000,
    description: 'Áo thun croptop nữ chất thun tăm co giãn 4 chiều ôm sát khoe trọn vòng eo thon gọn, dễ mix cùng quần ống rộng.',
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80',
    colors: ['Đen', 'Trắng', 'Đỏ Ruby', 'Xanh Mint'],
    sizes: ['Size S', 'Size M', 'Size L']
  },
  {
    name: 'Quần Suông Nữ Ống Rộng Lưng Cao Xếp Ly',
    category: 'Thời trang Nữ',
    brand: 'Uniqlo',
    price: 790000,
    description: 'Quần tây nữ ống rộng lưng cao hack chân dài tuyệt đối, chất vải mềm rũ chống nhăn, thích hợp cho mọi hoạt động.',
    image: 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=800&q=80',
    colors: ['Đen', 'Xám Titan', 'Be / Nude', 'Trắng'],
    sizes: ['Size S', 'Size M', 'Size L', 'Size XL']
  },
  {
    name: 'Áo Khoác Phao Nữ Siêu Nhẹ Uniqlo Ultra Light Down',
    category: 'Thời trang Nữ',
    brand: 'Uniqlo',
    price: 1590000,
    description: 'Áo phao nữ lông vũ cao cấp siêu nhẹ, thiết kế chiết eo thon gọn không bị cộm béo, giữ ấm cơ thể trong thời tiết giá rét.',
    image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&q=80',
    colors: ['Hồng Pastel', 'Đen', 'Trắng', 'Be / Nude'],
    sizes: ['Size S', 'Size M', 'Size L', 'Size XL']
  },
  {
    name: 'Đầm Hoa Nhí Vintage Nữ Thắt Nơ Eo Duyên Dáng',
    category: 'Thời trang Nữ',
    brand: 'Mango',
    price: 850000,
    description: 'Váy hoa nhí phong cách nàng thơ Pháp, tay bồng cánh tiên và đai thắt nơ tôn eo thon, lý tưởng cho những chuyến du lịch check-in.',
    image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80',
    colors: ['Hồng Pastel', 'Xanh Mint', 'Vàng Gold'],
    sizes: ['Size S', 'Size M', 'Size L']
  },

  // ==========================================
  // 6. ĐỒNG HỒ & PHỤ KIỆN (15 sản phẩm)
  // ==========================================
  {
    name: 'Đồng Hồ Cơ Nam Tissot PRX Powermatic 80 Thụy Sĩ',
    category: 'Đồng hồ & Phụ kiện',
    brand: 'Tissot',
    price: 18500000,
    description: 'Đồng hồ cơ tự động Thụy Sĩ Tissot PRX với khả năng trữ cót lên đến 80 giờ, mặt số vân Tapisserie dập nổi sang trọng và kính Sapphire chống trầy.',
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80',
    colors: ['Bạc', 'Xanh Navy', 'Đen', 'Vàng Gold'],
    sizes: ['Size 40mm'],
    customReviews: ['Hàng Thụy Sĩ hoàn thiện bóng bẩy, lên tay cực kỳ nam tính.', 'Kính Sapphire chống xước tuyệt đối, trữ cót 80h để qua tuần vẫn chạy chính xác.']
  },
  {
    name: 'Đồng Hồ Thông Minh Apple Watch Series 10 GPS',
    category: 'Đồng hồ & Phụ kiện',
    brand: 'Apple',
    price: 10990000,
    description: 'Apple Watch Series 10 với màn hình OLED góc nhìn rộng nhất, thiết kế mỏng nhẹ hơn 10%, đo điện tâm đồ ECG và phát hiện ngưng thở khi ngủ.',
    image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80',
    colors: ['Đen', 'Bạc', 'Vàng Gold', 'Titan Tự Nhiên'],
    sizes: ['Size 42mm / 44mm']
  },
  {
    name: 'Đồng Hồ Cơ Tự Động Seiko 5 Sports 24 Chân Kính',
    category: 'Đồng hồ & Phụ kiện',
    brand: 'Seiko',
    price: 6890000,
    description: 'Dòng đồng hồ thể thao cơ khí huyền thoại Nhật Bản với bộ máy Calibre 4R36 bền bỉ, dạ quang Lumibrite sáng rực trong bóng đêm và chống nước 100m.',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',
    colors: ['Đen', 'Xanh Navy', 'Bạc'],
    sizes: ['Size 42mm / 44mm']
  },
  {
    name: 'Đồng Hồ Thể Thao Chuyên Nghiệp Garmin Forerunner 265',
    category: 'Đồng hồ & Phụ kiện',
    brand: 'Garmin',
    price: 11690000,
    description: 'Đồng hồ chạy bộ GPS chuyên nghiệp với màn hình AMOLED rực rỡ, tính năng gợi ý bài tập Training Readiness và thời lượng pin 13 ngày.',
    image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800&q=80',
    colors: ['Đen', 'Trắng', 'Xanh Dương'],
    sizes: ['Size 42mm / 44mm']
  },
  {
    name: 'Đồng Hồ Nữ Daniel Wellington Petite Melrose Dây Lưới',
    category: 'Đồng hồ & Phụ kiện',
    brand: 'Daniel Wellington',
    price: 3890000,
    description: 'Đồng hồ nữ phong cách Bắc Âu thanh lịch với dây lưới kim loại mạ vàng hồng quý phái, mặt số trứng cá siêu mỏng 6mm cực kỳ quyến rũ.',
    image: 'https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=800&q=80',
    colors: ['Vàng Gold', 'Bạc', 'Đen'],
    sizes: ['Size 40mm']
  },
  {
    name: 'Đồng Hồ Nam Casio G-Shock GA-2100 Bát Giác Carbon',
    category: 'Đồng hồ & Phụ kiện',
    brand: 'Casio',
    price: 2790000,
    description: 'G-Shock "CasiOak" thiết kế vành bát giác đình đám, cấu trúc bảo vệ lõi carbon siêu bền chống va đập và chống nước độ sâu 200 mét.',
    image: 'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=800&q=80',
    colors: ['Đen', 'Trắng', 'Xanh Rêu'],
    sizes: ['Size 42mm / 44mm']
  },
  {
    name: 'Kính Mát Unisex Gentle Monster South Side Thời Trang',
    category: 'Đồng hồ & Phụ kiện',
    brand: 'Gentle Monster',
    price: 6200000,
    description: 'Kính râm gọng vuông bo tròn kinh điển từ Gentle Monster Hàn Quốc, tròng kính Zeiss chống tia UV400 bảo vệ mắt tuyệt đối.',
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80',
    colors: ['Đen', 'Nâu Da Bò', 'Trắng'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Ví Da Nam Cầm Tay Khắc Tên Da Bò Thật 100%',
    category: 'Đồng hồ & Phụ kiện',
    brand: 'Calvin Klein',
    price: 750000,
    description: 'Ví bóp nam gấp đôi da bò sáp nhập khẩu bền bỉ, tích hợp nhiều ngăn chứa thẻ chống quét trộm sóng từ RFID an toàn.',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80',
    colors: ['Nâu Da Bò', 'Đen'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Thắt Lưng Nam Da Bò Khóa Tự Động Sang Trọng',
    category: 'Đồng hồ & Phụ kiện',
    brand: 'Calvin Klein',
    price: 590000,
    description: 'Dây nịt nam da bò nguyên tấm mặt khóa hợp kim không gỉ sáng bóng, khóa ray trượt tự động tinh chỉnh kích cỡ vòng eo linh hoạt.',
    image: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800&q=80',
    colors: ['Đen', 'Nâu Da Bò'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Túi Xách Nữ Da Thật Phong Cách Công Sở Quý Phái',
    category: 'Đồng hồ & Phụ kiện',
    brand: 'Zara',
    price: 1850000,
    description: 'Túi xách đeo chéo nữ da bò dập vân quả trám cao cấp, quai xích kim loại mạ vàng sang trọng, không gian rộng rãi để vừa iPad và đồ trang điểm.',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80',
    colors: ['Đen', 'Be / Nude', 'Trắng', 'Đỏ Ruby'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Balo Laptop Chống Trộm Chống Nước Mark Ryden',
    category: 'Đồng hồ & Phụ kiện',
    brand: 'Nike',
    price: 890000,
    description: 'Balo công nghệ chuyên dụng đựng laptop 15.6 - 17 inch, khóa số TSA chống trộm, cổng sạc USB tích hợp bên ngoài và vải Oxford chống thấm nước.',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
    colors: ['Đen', 'Xám Titan'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Vòng Tay Bạc Nữ Ý S925 Đính Đá Lấp Lánh',
    category: 'Đồng hồ & Phụ kiện',
    brand: 'Daniel Wellington',
    price: 690000,
    description: 'Lắc tay bạc ý cao cấp đính đá Cubic Zirconia sáng lấp lánh như kim cương, khóa rút thông minh điều chỉnh vừa mọi cổ tay.',
    image: 'https://images.unsplash.com/photo-1611591475878-571f30e9d6d7?w=800&q=80',
    colors: ['Bạc', 'Vàng Gold'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Đồng Hồ Nam Casio Edifice Chronograph Kim Loại',
    category: 'Đồng hồ & Phụ kiện',
    brand: 'Casio',
    price: 3250000,
    description: 'Đồng hồ thể thao tốc độ lấy cảm hứng từ xe đua F1 với tính năng bấm giờ thể thao Chronograph, chống nước 100m và kim dạ quang phát sáng.',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',
    colors: ['Bạc', 'Đen', 'Xanh Navy'],
    sizes: ['Size 42mm / 44mm']
  },
  {
    name: 'Hộp Xoay Đồng Hồ Cơ Tự Động Vỏ Gỗ Sơn Mài',
    category: 'Đồng hồ & Phụ kiện',
    brand: 'Tissot',
    price: 1450000,
    description: 'Hộp nạp cót đồng hồ cơ tự động 2 xoay 3 tĩnh cao cấp, mô tơ Mabuchi Nhật Bản chạy êm tuyệt đối và đèn LED nội thất sang trọng.',
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80',
    colors: ['Đen', 'Nâu Da Bò'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Kính Mát Phân Cực Polarized Chống Chói Lái Xe',
    category: 'Đồng hồ & Phụ kiện',
    brand: 'Gentle Monster',
    price: 850000,
    description: 'Kính râm phi công tròng phân cực Polarized ngăn chặn 100% ánh sáng phản chiếu chói mắt khi lái xe đi nắng hoặc câu cá ngoài trời.',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80',
    colors: ['Đen', 'Xám Titan', 'Bạc'],
    sizes: ['Tiêu Chuẩn']
  },

  // ==========================================
  // 7. GAMING & GEARS (15 sản phẩm)
  // ==========================================
  {
    name: 'Chuột Gaming Không Dây Logitech G Pro X Superlight 2',
    category: 'Gaming & Gears',
    brand: 'Logitech',
    price: 3490000,
    description: 'Chuột gaming esports số 1 thế giới với trọng lượng siêu nhẹ 60g, cảm biến HERO 2 độ phân giải 32.000 DPI, switch quang cơ học LIGHTFORCE siêu nhạy.',
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80',
    colors: ['Đen', 'Trắng', 'Hồng Pastel'],
    sizes: ['Tiêu Chuẩn'],
    customReviews: ['Chuột nhẹ tênh, vẩy đạn CS2 và Valorant cực kỳ chuẩn xác.', 'Pin trâu dùng 2 tuần chưa hết, mắt đọc HERO 2 không bao giờ trượt.']
  },
  {
    name: 'Bàn Phím Cơ Custom Không Dây Keychron Q1 Pro QMK',
    category: 'Gaming & Gears',
    brand: 'Keychron',
    price: 4890000,
    description: 'Bàn phím cơ full nhôm CNC cao cấp, cấu trúc Double-Gasket êm tai, kết nối Bluetooth 5.1 đa thiết bị và tùy biến layout phím bằng QMK/VIA.',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
    colors: ['Đen', 'Bạc', 'Trắng'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Tai Nghe Gaming Không Dây HyperX Cloud III Wireless',
    category: 'Gaming & Gears',
    brand: 'HyperX',
    price: 3690000,
    description: 'Huyền thoại âm thanh gaming với đệm mút hoạt tính bọc da êm ái, pin khủng lên đến 120 giờ chơi game liên tục, driver 53mm định hướng góc cực chuẩn.',
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80',
    colors: ['Đen', 'Đỏ Ruby'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Chuột Gaming Razer DeathAdder V3 Pro Siêu Nhẹ',
    category: 'Gaming & Gears',
    brand: 'Razer',
    price: 3290000,
    description: 'Chuột gaming công thái học thế hệ mới trọng lượng 63g, cảm biến quang học Focus Pro 30K Optical và polling rate không dây lên đến 8000Hz.',
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80',
    colors: ['Đen', 'Trắng'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Bàn Phím Cơ Gaming Corsair K70 MAX Magnetic RGB',
    category: 'Gaming & Gears',
    brand: 'Corsair',
    price: 5490000,
    description: 'Bàn phím cơ công nghệ switch từ tính CORSAIR MGX điều chỉnh điểm nhận phím từ 0.4mm đến 3.6mm, tính năng Rapid Trigger phản xạ tức thì.',
    image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&q=80',
    colors: ['Đen'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Tai Nghe Gaming SteelSeries Arctis Nova Pro Wireless',
    category: 'Gaming & Gears',
    brand: 'SteelSeries',
    price: 8990000,
    description: 'Tai nghe gaming flagship chống ồn chủ động ANC, hệ thống 2 pin thay nóng liên tục không bao giờ hết điện, trạm giải mã âm thanh DAC GameDAC Gen 2.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    colors: ['Đen', 'Trắng'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Tay Cầm Chơi Game Sony DualSense Edge Không Dây PS5/PC',
    category: 'Gaming & Gears',
    brand: 'Sony',
    price: 4990000,
    description: 'Tay cầm chuyên nghiệp có thể thay thế module cần gạt analog, tùy biến nút gạt sau lưng, trigger lock chỉnh cự ly bấm và profile lưu trữ riêng.',
    image: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800&q=80',
    colors: ['Trắng', 'Đen'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Tay Cầm Xbox Wireless Controller Robot White Bluetooth',
    category: 'Gaming & Gears',
    brand: 'Razer',
    price: 1690000,
    description: 'Tay cầm chơi game chuẩn cho PC Windows và Xbox với báng cầm vân nhám chống trượt, nút D-pad lai chính xác và độ trễ cực thấp.',
    image: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800&q=80',
    colors: ['Trắng', 'Đen', 'Xanh Dương', 'Đỏ Ruby'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Ghế Gaming Công Thái Học Cao Cấp Hỗ Trợ Cột Sống',
    category: 'Gaming & Gears',
    brand: 'ASUS',
    price: 6500000,
    description: 'Ghế chơi game và làm việc công thái học đệm mút đúc lạnh nguyên khối, da PU kháng nước cao cấp, tay vịn 4D và góc ngả lưng lên đến 165 độ.',
    image: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=800&q=80',
    colors: ['Đen', 'Đỏ Ruby', 'Trắng'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Bàn Gaming Nâng Hạ Tự Động Động Cơ Kép RGB',
    category: 'Gaming & Gears',
    brand: 'Corsair',
    price: 7500000,
    description: 'Bàn gaming nâng hạ độ cao tự động từ 65cm đến 130cm, mặt bàn sợi carbon chống trầy, tích hợp dải đèn LED RGB và bộ nhớ 4 vị trí thông minh.',
    image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&q=80',
    colors: ['Đen', 'Trắng'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Micro Thu Âm Livestream Chuyên Nghiệp Cardioid',
    category: 'Gaming & Gears',
    brand: 'HyperX',
    price: 3890000,
    description: 'Microphone condenser thu âm podcast và streaming chất lượng phòng thu, tích hợp màng lọc âm pop filter và nút cảm ứng tắt tiếng nhanh chống ồn.',
    image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80',
    colors: ['Đen', 'Trắng'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Loa Gaming Đổi Màu RGB Soundbar Âm Thanh Vòm',
    category: 'Gaming & Gears',
    brand: 'Razer',
    price: 4890000,
    description: 'Thanh loa gaming soundbar nhỏ gọn đặt dưới màn hình với subwoofer rời tăng cường âm trầm uy lực, công nghệ âm thanh vòm THX Spatial Audio.',
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80',
    colors: ['Đen'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Lót Chuột Cỡ Lớn Gaming RGB Siêu Mượt 3XL',
    category: 'Gaming & Gears',
    brand: 'SteelSeries',
    price: 1190000,
    description: 'Bàn di chuột kích thước cực đại 1200x600mm bao phủ toàn bộ bàn làm việc, bề mặt vải vi dệt tối ưu cho cả chuột quang và laser, viền đèn LED RGB 2 vùng.',
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80',
    colors: ['Đen'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Webcam Livestream 4K 60FPS Lấy Nét Tự Động AI',
    category: 'Gaming & Gears',
    brand: 'Logitech',
    price: 4290000,
    description: 'Webcam độ phân giải Ultra HD 4K sắc nét, ống kính thủy tinh cao cấp góc rộng, tự động cân bằng sáng HDR và micro kép khử tiếng ồn.',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
    colors: ['Đen'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Vô Lăng Chơi Game Đua Xe Phản Hồi Lực Force Feedback',
    category: 'Gaming & Gears',
    brand: 'Logitech',
    price: 6990000,
    description: 'Bộ vô lăng và bàn đạp phanh ga côn chân thực công nghệ TRUEFORCE mô phỏng chính xác độ rung của lốp xe và mặt đường trong game đua xe.',
    image: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800&q=80',
    colors: ['Đen'],
    sizes: ['Tiêu Chuẩn']
  },

  // ==========================================
  // 8. NHÀ CỬA & ĐỜI SỐNG (15 sản phẩm)
  // ==========================================
  {
    name: 'Robot Hút Bụi Lau Nhà Tự Giặt Giẻ Roborock S8 Pro Ultra',
    category: 'Nhà cửa & Đời sống',
    brand: 'Roborock',
    price: 23990000,
    description: 'Robot thông minh nhất thế giới với trạm sạc All-in-one tự giặt giẻ nước nóng, sấy khô bằng khí nóng, tự động hút rác và lực hút 6000Pa cực mạnh.',
    image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&q=80',
    colors: ['Trắng', 'Đen'],
    sizes: ['Tiêu Chuẩn'],
    customReviews: ['Từ ngày có em này nhà sạch bóng, không phải động tay lau nhà nữa.', 'Tự giặt giẻ sấy khô không hề có mùi hôi. Đắt nhưng quá xứng đáng!']
  },
  {
    name: 'Nồi Chiên Không Dầu Điện Tử Philips XXL 7.2L',
    category: 'Nhà cửa & Đời sống',
    brand: 'Philips',
    price: 4990000,
    description: 'Công nghệ Rapid Air độc quyền giảm đến 90% lượng chất béo, dung tích lòng nồi lớn chiên nướng nguyên con gà 1.5kg, điều khiển qua app tiện lợi.',
    image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&q=80',
    colors: ['Đen', 'Xám Titan'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Máy Hút Bụi Cầm Tay Không Dây Dyson V15 Detect Absolute',
    category: 'Nhà cửa & Đời sống',
    brand: 'Dyson',
    price: 19990000,
    description: 'Máy hút bụi Dyson đầu hút tích hợp tia laser phát hiện bụi vô hình, cảm biến Piezo tự động tăng công suất khi gặp bụi dày, pin hút liên tục 60 phút.',
    image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&q=80',
    colors: ['Vàng Gold', 'Bạc'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Máy Lọc Không Khí Thông Minh Xiaomi Smart Air Purifier 4 Pro',
    category: 'Nhà cửa & Đời sống',
    brand: 'Xiaomi',
    price: 4290000,
    description: 'Hệ thống lọc 3 trong 1 loại bỏ 99.97% bụi mịn PM2.5, phấn hoa và mùi hôi thú cưng, diện tích lọc hiệu quả lên đến 60m2 với độ ồn cực thấp.',
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80',
    colors: ['Trắng'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Bộ Nồi Chảo Chống Dính Inox 304 Cao Cấp Tefal 6 Món',
    category: 'Nhà cửa & Đời sống',
    brand: 'Tefal',
    price: 3590000,
    description: 'Bộ nồi chảo tay cầm tháo rời thông minh xếp chồng gọn gàng, lớp phủ chống dính Titanium bền bỉ gấp 6 lần, đáy từ dùng tốt trên mọi loại bếp.',
    image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&q=80',
    colors: ['Đen', 'Đỏ Ruby'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Bình Giữ Nhiệt Khóa Thông Minh Lock&Lock Feather Light 500ml',
    category: 'Nhà cửa & Đời sống',
    brand: 'Lock&Lock',
    price: 390000,
    description: 'Thân bình thép không gỉ SUS 304 cao cấp giữ nóng 8 giờ và giữ lạnh 24 giờ, trọng lượng siêu nhẹ 230g dễ dàng bỏ túi đi làm đi học.',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80',
    colors: ['Đen', 'Trắng', 'Hồng Pastel', 'Xanh Mint'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Máy Xay Sinh Tố Cầm Tay Đa Năng Panasonic Kháng Khuẩn',
    category: 'Nhà cửa & Đời sống',
    brand: 'Panasonic',
    price: 1490000,
    description: 'Lưỡi dao 4 cánh bằng thép không gỉ công nghệ Nhật Bản sắc bén, đi kèm cối xay thịt và cây đánh trứng tiện lợi cho bữa ăn gia đình.',
    image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&q=80',
    colors: ['Trắng', 'Đen'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Máy Ép Chậm Trục Ngang Hurom Giữ Trọn Dưỡng Chất',
    category: 'Nhà cửa & Đời sống',
    brand: 'Philips',
    price: 8500000,
    description: 'Công nghệ ép chậm 43 vòng/phút giữ lại 99% vitamin và enzyme tự nhiên trong hoa quả, bã kiệt khô nước ép không bị phân tầng tách lớp.',
    image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&q=80',
    colors: ['Trắng', 'Đen', 'Đỏ Ruby'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Đèn Bàn Chống Cận Học Tập Làm Việc LED Philips Blade',
    category: 'Nhà cửa & Đời sống',
    brand: 'Philips',
    price: 1190000,
    description: 'Đèn bàn bảo vệ mắt công nghệ EyeComfort không nhấp nháy, chỉ số hoàn màu cao CRI 90 tái hiện màu sắc trung thực, điều chỉnh 4 mức sáng.',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80',
    colors: ['Trắng', 'Đen'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Máy Pha Cà Phê Espresso Gia Đình Tự Động DeLonghi',
    category: 'Nhà cửa & Đời sống',
    brand: 'Philips',
    price: 5490000,
    description: 'Áp suất bơm 15 bar chuẩn quán cà phê Ý, vòi tạo bọt sữa đánh bọt mịn màng cho ly Cappuccino và Latte thơm lừng mỗi sáng tại nhà.',
    image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80',
    colors: ['Bạc', 'Đen', 'Đỏ Ruby'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Quạt Không Cánh Lọc Không Khí Dyson Pure Cool Link',
    category: 'Nhà cửa & Đời sống',
    brand: 'Dyson',
    price: 12490000,
    description: 'Thiết kế không cánh an toàn tuyệt đối cho trẻ nhỏ, luồng gió mát tự nhiên kết hợp màng lọc HEPA 360 độ lọc sạch vi khuẩn trong phòng ngủ.',
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80',
    colors: ['Trắng', 'Bạc'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Bộ Ga Gối Cotton Tencel Lụa 4 Món Mềm Mịn Cao Cấp',
    category: 'Nhà cửa & Đời sống',
    brand: 'Lock&Lock',
    price: 1290000,
    description: 'Bộ chăn ga gối sợi Tencel chiết xuất từ gỗ bạch đàn thiên nhiên siêu mềm mượt, thấm hút mồ hôi và kháng khuẩn tự nhiên cho giấc ngủ sâu.',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80',
    colors: ['Xám Titan', 'Xanh Mint', 'Hồng Pastel', 'Be / Nude'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Bàn Là Hơi Nước Cầm Tay Gấp Gọn Philips Series 3000',
    category: 'Nhà cửa & Đời sống',
    brand: 'Philips',
    price: 990000,
    description: 'Bàn ủi hơi nước cầm tay làm nóng nhanh trong 30 giây, luồng hơi liên tục 20g/phút tiêu diệt 99.9% vi khuẩn, thiết kế gập gọn mang đi du lịch.',
    image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&q=80',
    colors: ['Trắng', 'Xanh Mint'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Máy Làm Sữa Hạt Tự Động Đa Năng Chống Trào',
    category: 'Nhà cửa & Đời sống',
    brand: 'Tefal',
    price: 2390000,
    description: 'Máy xay nấu sữa hạt 8 chức năng tự động xay mịn không cần lọc lại, cối thủy tinh Borosilicate chịu nhiệt cao và chế độ tự vệ sinh tiện lợi.',
    image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&q=80',
    colors: ['Trắng', 'Be / Nude'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Nồi Cơm Điện Cao Tần Cuckoo 1.8L Áp Suất Kép',
    category: 'Nhà cửa & Đời sống',
    brand: 'Panasonic',
    price: 6890000,
    description: 'Công nghệ nấu cơm áp suất kép giữ hạt cơm dẻo thơm nguyên hạt, lòng nồi tráng men kim cương chống dính cao cấp tiêu chuẩn Hàn Quốc.',
    image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&q=80',
    colors: ['Đen', 'Trắng'],
    sizes: ['Tiêu Chuẩn']
  },

  // ==========================================
  // 9. SỨC KHỎE & LÀM ĐẸP (15 sản phẩm)
  // ==========================================
  {
    name: 'Serum Phục Hồi Chống Lão Hóa Estee Lauder Advanced Night Repair',
    category: 'Sức khỏe & Làm đẹp',
    brand: 'Estee Lauder',
    price: 2890000,
    description: 'Tinh chất phục hồi ban đêm huyền thoại số 1 thế giới với công nghệ ChronoluxCB độc quyền giúp tái tạo làn da tươi trẻ, căng mọng và rạng rỡ.',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80',
    colors: ['Tự Nhiên'],
    sizes: ['Dung tích 50ml', 'Dung tích 100ml'],
    priceOverrideMap: { 'Dung tích 50ml': 2890000, 'Dung tích 100ml': 4290000 },
    customReviews: ['Dùng ban đêm sáng hôm sau da căng mướt thấy rõ, nếp nhăn mờ dần.', 'Chai thứ 3 rồi, serum dưỡng ẩm và phục hồi da đỉnh nhất từng dùng.']
  },
  {
    name: 'Kem Dưỡng Ẩm Phục Hồi Da La Roche-Posay Cicaplast Baume B5+',
    category: 'Sức khỏe & Làm đẹp',
    brand: 'La Roche-Posay',
    price: 420000,
    description: 'Kem dưỡng ẩm làm dịu và phục hồi màng bảo vệ da bị tổn thương với 5% Panthenol (Vitamin B5), Madecassoside và nước khoáng La Roche-Posay.',
    image: 'https://images.unsplash.com/photo-1608248597359-2e06a928929e?w=800&q=80',
    colors: ['Tự Nhiên'],
    sizes: ['Dung tích 50ml', 'Dung tích 100ml']
  },
  {
    name: 'Kem Chống Nắng Kiểm Soát Dầu La Roche-Posay Anthelios 50ml',
    category: 'Sức khỏe & Làm đẹp',
    brand: 'La Roche-Posay',
    price: 385000,
    description: 'Kem chống nắng quang phổ rộng SPF 50+ chống tia UVA/UVB và ánh sáng xanh, màng lọc Mexoryl 400 và công nghệ kiềm dầu Airlicium suốt 12 giờ.',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80',
    colors: ['Tự Nhiên'],
    sizes: ['Dung tích 50ml']
  },
  {
    name: 'Máy Sấy Tóc Thông Minh Dyson Supersonic HD15 Nprotect',
    category: 'Sức khỏe & Làm đẹp',
    brand: 'Dyson',
    price: 12490000,
    description: 'Máy sấy tóc động cơ kỹ thuật số Dyson V9 kiểm soát nhiệt độ thông minh tránh hư tổn do nhiệt, bảo vệ độ bóng tự nhiên của mái tóc.',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
    colors: ['Hồng Pastel', 'Xám Titan', 'Đỏ Ruby'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Bàn Chải Đánh Răng Điện Thông Minh Oral-B iO Series 9 AI',
    category: 'Sức khỏe & Làm đẹp',
    brand: 'Oral-B',
    price: 5890000,
    description: 'Công nghệ rung từ tính êm ái kết hợp đầu chải tròn chuyển động micro-vibration, cảm biến áp lực thông minh bảo vệ nướu và theo dõi chải răng 3D qua app.',
    image: 'https://images.unsplash.com/photo-1559591937-e1032d8479e0?w=800&q=80',
    colors: ['Đen', 'Trắng', 'Hồng Pastel'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Mặt Nạ Ngủ Cấp Nước Chuyên Sâu Laneige Water Sleeping Mask 70ml',
    category: 'Sức khỏe & Làm đẹp',
    brand: 'Laneige',
    price: 590000,
    description: 'Công nghệ Sleeping Micro Biome độc quyền phục hồi hệ vi sinh trên da suốt đêm, cung cấp độ ẩm dồi dào cho làn da trong mướt rạng ngời.',
    image: 'https://images.unsplash.com/photo-1567928815104-b7980ee5032e?w=800&q=80',
    colors: ['Tự Nhiên'],
    sizes: ['Dung tích 50ml', 'Dung tích 100ml']
  },
  {
    name: 'Serum Làm Sáng Da Mờ Thâm Nám Kiehl’s Clearly Corrective 50ml',
    category: 'Sức khỏe & Làm đẹp',
    brand: 'Kiehl’s',
    price: 2350000,
    description: 'Serum chứa dẫn xuất Vitamin C thế hệ mới và chiết xuất Bạch Dương trắng giúp làm mờ thâm mụn, đều màu da và ngăn ngừa đốm nâu hiệu quả.',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80',
    colors: ['Tự Nhiên'],
    sizes: ['Dung tích 50ml', 'Dung tích 100ml']
  },
  {
    name: 'Tinh Chất Dưỡng Ẩm Trà Xanh Innisfree Green Tea Seed Serum 80ml',
    category: 'Sức khỏe & Làm đẹp',
    brand: 'Innisfree',
    price: 520000,
    description: 'Chiết xuất từ lá trà xanh tươi đảo Jeju kết hợp 5 loại Hyaluronic Acid cấp ẩm sâu vào các tầng da, củng cố hàng rào ẩm chỉ sau 1 lần thoa.',
    image: 'https://images.unsplash.com/photo-1608248597359-2e06a928929e?w=800&q=80',
    colors: ['Tự Nhiên'],
    sizes: ['Dung tích 50ml', 'Dung tích 100ml']
  },
  {
    name: 'Nước Tẩy Trang Cấp Ẩm L’Oreal Paris Micellar Water 400ml',
    category: 'Sức khỏe & Làm đẹp',
    brand: 'L’Oreal',
    price: 189000,
    description: 'Nước tẩy trang phân tử Micellar hút sạch bụi bẩn, dầu thừa và lớp trang điểm mà không làm khô căng da, an toàn cho cả vùng mắt môi.',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80',
    colors: ['Tự Nhiên'],
    sizes: ['Dung tích 100ml']
  },
  {
    name: 'Máy Massage Cổ Vai Gáy Chườm Ấm Xung Điện Philips',
    category: 'Sức khỏe & Làm đẹp',
    brand: 'Philips',
    price: 1890000,
    description: 'Máy massage mô phỏng bàn tay người xoa bóp chuyên sâu vùng cơ cổ vai gáy, tích hợp nhiệt chườm ấm 42 độ C giúp giãn cơ và giảm đau mỏi nhanh chóng.',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
    colors: ['Xám Titan', 'Xanh Mint'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Phấn Nước Che Khuyết Điểm Kiềm Dầu Laneige Neo Cushion 15g',
    category: 'Sức khỏe & Làm đẹp',
    brand: 'Laneige',
    price: 650000,
    description: 'Phấn nước cushion mỏng nhẹ che phủ 24 giờ không lem dính khẩu trang, chống nắng SPF 42 PA++ bảo vệ da suốt ngày dài.',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
    colors: ['Be / Nude', 'Trắng'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Cân Sức Khỏe Điện Tử Phân Tích Cơ Thể Xiaomi Body Scale 2',
    category: 'Sức khỏe & Làm đẹp',
    brand: 'Xiaomi',
    price: 490000,
    description: 'Cảm biến thép mangan siêu nhạy đo chính xác 13 chỉ số cơ thể gồm mỡ nội tạng, cơ bắp, lượng nước, BMI đồng bộ dữ liệu qua app Mi Fitness.',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
    colors: ['Trắng'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Dầu Gội Xả Phục Hồi Tóc Hư Tổn Olaplex Bond Maintenance 250ml',
    category: 'Sức khỏe & Làm đẹp',
    brand: 'L’Oreal',
    price: 1450000,
    description: 'Bộ gội xả công nghệ hàn gắn liên kết lưu huỳnh trong tóc bị đứt gãy do uốn nhuộm tẩy, phục hồi mái tóc chắc khỏe mềm mượt bồng bềnh.',
    image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&q=80',
    colors: ['Tự Nhiên'],
    sizes: ['Dung tích 100ml']
  },
  {
    name: 'Máy Rửa Mặt Sóng Âm Chống Lão Hóa Cầm Tay Silicone',
    category: 'Sức khỏe & Làm đẹp',
    brand: 'Philips',
    price: 1890000,
    description: 'Đầu cọ silicone y tế siêu mềm kháng khuẩn, sóng âm T-Sonic 8000 xung/phút làm sạch sâu tận lỗ chân lông loại bỏ 99.5% bụi bẩn và dầu thừa.',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
    colors: ['Hồng Pastel', 'Xanh Mint', 'Tím Lavender'],
    sizes: ['Tiêu Chuẩn']
  },
  {
    name: 'Son Thỏi Lì Cao Cấp Mịn Môi Dưỡng Ẩm Lâu Trôi',
    category: 'Sức khỏe & Làm đẹp',
    brand: 'Estee Lauder',
    price: 1050000,
    description: 'Son thỏi lì chuẩn màu sắc nét, chất son mịn như nhung không lộ vân môi, bổ sung tinh dầu dưỡng ẩm môi mềm mượt suốt 10 tiếng.',
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&q=80',
    colors: ['Đỏ Ruby', 'Hồng Pastel', 'Đỏ Burgundy', 'Cam Cyberpunk'],
    sizes: ['Tiêu Chuẩn']
  }
];
