import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { User } from '../schemas/entities/user.entity';
import { Role } from '../schemas/entities/role.entity';
import { Color } from '../schemas/entities/color.entity';
import { Size } from '../schemas/entities/size.entity';
import { ColorSize } from '../schemas/entities/color-size.entity';
import { Category } from '../schemas/entities/category.entity';
import { Product } from '../schemas/entities/product.entity';
import { ProductVariant } from '../schemas/entities/product-variant.entity';
import { ProductImage } from '../schemas/entities/product-image.entity';
import { Address } from '../schemas/entities/address.entity';
import { Order } from '../schemas/entities/order.entity';
import { OrderItem } from '../schemas/entities/order-item.entity';
import { Payment } from '../schemas/entities/payment.entity';
import { FlashSale } from '../schemas/entities/flash-sale.entity';
import { FlashSaleItem } from '../schemas/entities/flash-sale-item.entity';
import { RoleEnum } from '../../common/enums/role.enum';
import { MemberType } from '../schemas/entities/member-type.entity';
import { Brand } from '../schemas/entities/brand.entity';
import { MembershipHistory } from '../schemas/entities/membership-history.entity';
import { CashbackTransaction } from '../schemas/entities/cashback-transaction.entity';
import { UserVoucher } from '../schemas/entities/user-voucher.entity';

const get = (key: string, defaultValue?: string) =>
  process.env[key] ?? defaultValue ?? '';

function randomVietnameseName() {
  const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Phan', 'Vũ', 'Đặng'];
  const middleNames = ['Văn', 'Thị', 'Hữu', 'Minh', 'Quang', 'Thành'];
  const firstNames = ['An', 'Bình', 'Chi', 'Dũng', 'Hà', 'Lan', 'Nam', 'Phương', 'Quyên', 'Tuấn'];
  return `${faker.helpers.arrayElement(lastNames)} ${faker.helpers.arrayElement(middleNames)} ${faker.helpers.arrayElement(firstNames)}`;
}

function randomVietnamAddress() {
  const streets = ['Lê Lợi', 'Hàng Bài', 'Trần Hưng Đạo', 'Nguyễn Huệ', 'Huỳnh Thúc Kháng'];
  const wards = ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4'];
  const districts = ['Quận 1', 'Quận 3', 'Quận 5', 'Quận 10'];
  const provinces = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];
  return {
    fullAddress: `${faker.helpers.arrayElement(streets)} ${faker.number.int({ min: 1, max: 500 })}`,
    ward: faker.helpers.arrayElement(wards),
    district: faker.helpers.arrayElement(districts),
    province: faker.helpers.arrayElement(provinces),
  };
}

const AppDataSource = new DataSource({
  type: 'mysql',
  host: get('DB_HOST', 'localhost'),
  port: Number(get('DB_PORT') ?? 3306),
  username: get('DB_USERNAME', 'root'),
  password: get('DB_PASSWORD', '123456'),
  database: get('DB_DATABASE', 'ecommerce'),
  entities: [
    User, Role, Color, Size, ColorSize, Category, Product, ProductVariant,
    ProductImage, Address, Order, OrderItem, Payment, FlashSale, FlashSaleItem,
    MemberType, Brand, MembershipHistory, CashbackTransaction, UserVoucher,
  ],
  synchronize: true,
  logging: false,
});

async function runSeed() {
  await AppDataSource.initialize();
  console.log('✅ Kết nối database thành công!');

  const roleRepo = AppDataSource.getRepository(Role);
  const colorRepo = AppDataSource.getRepository(Color);
  const sizeRepo = AppDataSource.getRepository(Size);
  const userRepo = AppDataSource.getRepository(User);
  const categoryRepo = AppDataSource.getRepository(Category);
  const productRepo = AppDataSource.getRepository(Product);
  const variantRepo = AppDataSource.getRepository(ProductVariant);
  const productImageRepo = AppDataSource.getRepository(ProductImage);
  const addressRepo = AppDataSource.getRepository(Address);
  const orderRepo = AppDataSource.getRepository(Order);
  const orderItemRepo = AppDataSource.getRepository(OrderItem);
  const paymentRepo = AppDataSource.getRepository(Payment);
  const flashSaleRepo = AppDataSource.getRepository(FlashSale);
  const flashSaleItemRepo = AppDataSource.getRepository(FlashSaleItem);
  const memberTypeRepo = AppDataSource.getRepository(MemberType);
  const brandRepo = AppDataSource.getRepository(Brand);
  const customerRole = await roleRepo.findOneBy({ name: RoleEnum.CUSTOMER });
  if (!customerRole) throw new Error(`Role '${RoleEnum.CUSTOMER}' chưa tồn tại trong DB!`);

  // Seed Option B Member Types
  const memberTypesData = [
    { name: 'Thành viên Đồng', code: 'MEMBER', rankLevel: 1, minOrders: 0, minSpent: 0, cashbackRate: 1.0, discountPercent: 0, description: 'Hạng khởi đầu cho khách hàng mới' },
    { name: 'Thành viên Bạc', code: 'SILVER', rankLevel: 2, minOrders: 3, minSpent: 2000000, cashbackRate: 2.0, discountPercent: 2, description: 'Hạng Bạc dành cho khách hàng thân thiết' },
    { name: 'Thành viên Vàng', code: 'GOLD', rankLevel: 3, minOrders: 10, minSpent: 5000000, cashbackRate: 3.0, discountPercent: 5, description: 'Hạng Vàng với ưu đãi hoàn tiền 3% và hỗ trợ ưu tiên' },
    { name: 'Thành viên Bạch Kim', code: 'PLATINUM', rankLevel: 4, minOrders: 25, minSpent: 15000000, cashbackRate: 4.0, discountPercent: 7, description: 'Hạng Bạch Kim dành cho VIP' },
    { name: 'Thành viên Kim Cương', code: 'DIAMOND', rankLevel: 5, minOrders: 50, minSpent: 30000000, cashbackRate: 5.0, discountPercent: 10, description: 'Hạng Kim Cương cao cấp nhất với đặc quyền VIP' },
  ];

  const seededMemberTypes: MemberType[] = [];
  for (const mtData of memberTypesData) {
    let existing = await memberTypeRepo.findOne({ where: { code: mtData.code } });
    if (!existing) {
      existing = memberTypeRepo.create(mtData);
      existing = await memberTypeRepo.save(existing);
    }
    seededMemberTypes.push(existing);
  }
  const defaultMemberType = seededMemberTypes.find(mt => mt.code === 'MEMBER') || seededMemberTypes[0];

  // Colors
  const colorsData = [
    { name: 'Đỏ', hexCode: '#FF0000' },
    { name: 'Xanh', hexCode: '#0000FF' },
    { name: 'Xanh lá', hexCode: '#00FF00' },
  ];
  const colors = await colorRepo.save(colorsData.map(c => colorRepo.create(c)));

  // Sizes
  const sizes = await sizeRepo.save(['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(name => sizeRepo.create({ name })));

  // Users
  const users: User[] = [];
  for (let i = 0; i < 10; i++) {
    const user = userRepo.create({
      name: randomVietnameseName(),
      email: faker.internet.email(),
      passwordHash: faker.internet.password(),
      isVerified: true,
      role: customerRole,
      memberType: defaultMemberType,
    });
    users.push(await userRepo.save(user));
  }


  // Addresses
  const addresses: Address[] = [];
  for (const user of users) {
    const addr = randomVietnamAddress();
    const address = addressRepo.create({
      user,
      recipientName: randomVietnameseName(),
      phone: '0' + faker.string.numeric(9),
      fullAddress: addr.fullAddress,
      ward: addr.ward,
      district: addr.district,
      province: addr.province,
      isDefault: true,
    });
    addresses.push(await addressRepo.save(address));
  }

  // Categories
  const categoryNames = ['Áo', 'Quần', 'Giày', 'Phụ kiện'];
  const categories: Category[] = [];
  for (const name of categoryNames) {
    const cat = categoryRepo.create({
      name,
      description: faker.commerce.productDescription(),
    });
    categories.push(await categoryRepo.save(cat));
  }

  // Products + Variants + hasVariants
  const products: Product[] = [];
  for (let i = 0; i < 20; i++) {
    const product = productRepo.create({
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: faker.number.int({ min: 100000, max: 2000000 }),
      brand: faker.company.name(),
      category: faker.helpers.arrayElement(categories),
      status: 'ACTIVE',
      hasVariants: false,
    });
    await productRepo.save(product);

    // Quyết định có variant hay không
    const createVariant = faker.datatype.boolean(); // 50% chance
    let variants: ProductVariant[] = [];
    if (createVariant) {
      const count = faker.number.int({ min: 2, max: 3 });
      for (let j = 0; j < count; j++) {
        const variant = variantRepo.create({
          product,
          color: faker.helpers.arrayElement(colors),
          size: faker.helpers.arrayElement(sizes),
          stockQuantity: faker.number.int({ min: 5, max: 50 }),
          priceOverride: product.price,
        });
        variants.push(await variantRepo.save(variant));
      }
      product.hasVariants = true;
      await productRepo.save(product);
    } else {
      // Tạo 1 variant mặc định cho sản phẩm không có variant
      const variant = variantRepo.create({
        product,
        color: faker.helpers.arrayElement(colors),
        size: faker.helpers.arrayElement(sizes),
        stockQuantity: faker.number.int({ min: 5, max: 50 }),
        priceOverride: product.price,
      });
      variants.push(await variantRepo.save(variant));
      product.hasVariants = false;
      await productRepo.save(product);
    }

    // ProductImages
    const countImages = faker.number.int({ min: 1, max: 2 });
    for (let k = 0; k < countImages; k++) {
      const image = productImageRepo.create({
        product,
        imageUrl: faker.image.url({ width: 640, height: 480 }),
        isMain: k === 0,
      });
      await productImageRepo.save(image);
    }

    products.push(product);
  }

  // Orders + OrderItems + Payments
  for (let i = 0; i < 15; i++) {
    const user = faker.helpers.arrayElement(users);
    const orderAddress = faker.helpers.arrayElement(addresses.filter(a => a.user.id === user.id));

    const order = orderRepo.create({
      user,
      totalAmount: 0,
      status: faker.helpers.arrayElement(['PAID', 'SHIPPED', 'DELIVERED']),
      paymentMethod: faker.helpers.arrayElement(['Tiền mặt', 'Thẻ']),
      shippingAddress: orderAddress,
    });
    const savedOrder = await orderRepo.save(order);

    const orderProducts = faker.helpers.arrayElements(products, faker.number.int({ min: 1, max: 3 }));
    let total = 0;

    for (const product of orderProducts) {
      const variants = await variantRepo.find({ where: { product: { id: product.id } } });
      const variant = faker.helpers.arrayElement(variants);

      const quantity = faker.number.int({ min: 1, max: 5 });
      const price = variant.priceOverride;
      total += price * quantity;

      const orderItem = orderItemRepo.create({
        order: savedOrder,
        variant,
        quantity,
        priceAtTime: price,
      });
      await orderItemRepo.save(orderItem);
    }

    savedOrder.totalAmount = total;
    await orderRepo.save(savedOrder);

    const payment = paymentRepo.create({
      order: savedOrder,
      orderId: savedOrder.id,
      paymentMethod: faker.helpers.arrayElement(['Tiền mặt', 'Thẻ']),
      status: 'PAID',
      paymentTime: new Date(),
    });
    await paymentRepo.save(payment);
  }

  // FlashSales + FlashSaleItems
  for (let i = 0; i < 5; i++) {
    const product = faker.helpers.arrayElement(products);
    const flashSale = flashSaleRepo.create({
      title: `Flash Sale ${i + 1}`,
      startTime: faker.date.soon({ days: 2 }),
      endTime: faker.date.soon({ days: 5 }),
      isActive: true,
      productId: product.id,
    });
    const savedFlashSale = await flashSaleRepo.save(flashSale);

    const variants = await variantRepo.find({ where: { product: { id: product.id } } });
    for (const variant of variants) {
      const discountPercent = faker.number.int({ min: 10, max: 50 });
      const salePrice = Number(((variant.priceOverride ?? product.price) * (1 - discountPercent / 100)).toFixed(2));
      const flashSaleItem = flashSaleItemRepo.create({
        flashSale: savedFlashSale,
        product,
        productVariant: variant,
        salePrice,
        discountPercent,
        quantity: faker.number.int({ min: 1, max: 20 }),
        note: 'Flash Sale',
      });
      await flashSaleItemRepo.save(flashSaleItem);
    }
  }

  console.log('🎉 Seed hoàn tất!');
  process.exit(0);
}

runSeed().catch(err => {
  console.error('❌ Lỗi khi seed:', err);
  process.exit(1);
});
