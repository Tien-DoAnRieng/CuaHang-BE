import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { ChatMessage } from '../../shared/schemas/chat-message.entity';
import { User } from '../../shared/schemas/entities/user.entity';
import { Product } from '../../shared/schemas/entities/product.entity';
import { OrderItem } from '../../shared/schemas/entities/order-item.entity';
import { FlashSale } from '../../shared/schemas/entities/flash-sale.entity';
import { ConfigService } from '@nestjs/config';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { v2 as cloudinary } from 'cloudinary';
const streamifier = require('streamifier');

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private geminiCooldownUntil = 0;
  private lastGeminiIssue: 'none' | 'quota' | 'model' | 'other' = 'none';
  private readonly aiResponseCache = new Map<string, { text: string; expiresAt: number }>();
  private readonly cacheTtlMs = 5 * 60 * 1000;

  private readonly conciseRules = [
    'Tra loi bang tieng Viet, gon gang, toi da 120 tu.',
    'Chi tap trung vao san pham va mua hang. Khong viet mo dau dai dong.',
    'Khong noi ve chinh sach noi bo, khong tu nhan la mo hinh AI.',
    'Neu co ngan sach, tuyet doi khong de xuat san pham vuot ngan sach.',
  ];

  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepo: Repository<ChatMessage>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(FlashSale)
    private readonly flashSaleRepo: Repository<FlashSale>,
    private readonly configService: ConfigService,
  ) {}

  private normalizeNumber(value: unknown): number {
    if (typeof value === 'number') return value;
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  private isCheapestIntent(message: string): boolean {
    const text = (message || '').toLowerCase();
    return /(re\s*nhat|rẻ\s*nhất|gia\s*re\s*nhat|giá\s*rẻ\s*nhất|thap\s*nhat|thấp\s*nhất|cheapest|min\s*price)/i.test(
      text,
    );
  }

  private prefersLowPrice(message: string): boolean {
    const text = (message || '').toLowerCase();
    return /(gia\s*re|giá\s*rẻ|tiet\s*kiem|tiết\s*kiệm|budget|duoi|dưới|<=|<)/i.test(text);
  }

  private isHighestPriceIntent(message: string): boolean {
    const text = (message || '').toLowerCase();
    return /(gia\s*cao\s*nhat|giá\s*cao\s*nhất|dat\s*nhat|đắt\s*nhất|max\s*price|cao\s*nhat)/i.test(text);
  }

  private isBestSellingIntent(message: string): boolean {
    const text = (message || '').toLowerCase();
    return /(ban\s*chay\s*nhat|bán\s*chạy\s*nhất|top\s*ban\s*chay|top\s*bán\s*chạy|best\s*seller|bestseller)/i.test(
      text,
    );
  }

  private isFlashSaleIntent(message: string): boolean {
    const text = (message || '').toLowerCase();
    return /(flash\s*sale|f\s*sale|sale\s*soc|sale\s*sốc|khuyen\s*mai|khuyến\s*mãi|dang\s*giam\s*gia|đang\s*giảm\s*giá)/i.test(
      text,
    );
  }

  private async findHighestPriceProducts(limit: number = 3): Promise<Product[]> {
    return this.productRepo.find({
      where: { status: 'ACTIVE' },
      relations: ['category', 'brandEntity', 'images', 'variants'],
      order: { price: 'DESC' as any },
      take: limit,
    });
  }

  private async findBestSellingProducts(limit: number = 10): Promise<Product[]> {
    const statuses = [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED];

    const rows = await this.orderItemRepo
      .createQueryBuilder('oi')
      .innerJoin('product_variants', 'pv', 'oi.variant_id = pv.id')
      .innerJoin('products', 'p', 'pv.product_id = p.id')
      .innerJoin('orders', 'o', 'oi.order_id = o.id')
      .where('o.status IN (:...statuses)', { statuses })
      .andWhere('p.status = :status', { status: 'ACTIVE' })
      .select('p.id', 'productId')
      .addSelect('SUM(oi.quantity)', 'sold')
      .groupBy('p.id')
      .orderBy('sold', 'DESC')
      .limit(limit)
      .getRawMany();

    const ids = rows.map((r) => r.productId).filter(Boolean);
    if (ids.length === 0) return [];

    const products = await this.productRepo.find({
      where: ids.map((id) => ({ id })),
      relations: ['category', 'brandEntity', 'images', 'variants'],
    });

    const indexMap = new Map(products.map((p) => [p.id, p]));
    return ids.map((id) => indexMap.get(id)).filter(Boolean) as Product[];
  }

  private async findActiveFlashSaleProducts(limit: number = 3): Promise<Product[]> {
    const now = new Date();

    const flashSales = await this.flashSaleRepo
      .createQueryBuilder('fs')
      .leftJoinAndSelect('fs.items', 'item')
      .leftJoinAndSelect('item.product', 'product')
      .leftJoinAndSelect('product.images', 'images')
      .where('fs.isActive = :active', { active: true })
      .andWhere('fs.startTime <= :now', { now })
      .andWhere('fs.endTime >= :now', { now })
      .orderBy('fs.startTime', 'DESC')
      .getMany();

    const productMap = new Map<string, Product>();
    for (const fs of flashSales) {
      for (const item of fs.items || []) {
        if (item.product?.id && !productMap.has(item.product.id)) {
          productMap.set(item.product.id, item.product as Product);
        }
      }
    }

    return Array.from(productMap.values()).slice(0, limit);
  }

  private extractBudgetFromMessage(message: string): number | null {
    const text = (message || '').toLowerCase();

    // Match patterns like: "duoi 500.000", "< 500k", "toi da 1.2 trieu"
    const patterns = [
      /(duoi|dưới|toi da|tối đa|<=|<)\s*([\d.,]+)\s*(k|nghin|nghìn|trieu|triệu|m|vnd|dong|đ|)?/i,
      /([\d.,]+)\s*(k|nghin|nghìn|trieu|triệu|m|vnd|dong|đ)\s*(tro xuong|trở xuống|do lai|đổ lại|duoi|dưới)?/i,
    ];

    for (const rgx of patterns) {
      const match = text.match(rgx);
      if (!match) continue;

      const captures = match.slice(1).map((s) => (s || '').trim());
      const numberToken = captures.find((s) => /\d/.test(s)) || '';
      const unit =
        captures.find((s) => /^(k|nghin|nghìn|trieu|triệu|m|vnd|dong|đ)$/i.test(s))?.toLowerCase() || '';

      let base = 0;
      if (unit.includes('trieu') || unit.includes('triệu') || unit === 'm') {
        // Support decimal millions like "1.2 trieu"
        const normalized = numberToken.replace(/\s+/g, '').replace(/,/g, '.');
        base = Number(normalized);
      } else {
        // Support grouped values like "500.000" or "1,200,000"
        const normalized = numberToken.replace(/[^\d]/g, '');
        base = Number(normalized);
      }

      if (!Number.isFinite(base) || base <= 0) continue;

      if (unit.includes('trieu') || unit.includes('triệu') || unit === 'm') {
        base *= 1_000_000;
      } else if (unit === 'k' || unit.includes('nghin') || unit.includes('nghìn')) {
        base *= 1_000;
      } else if (base < 10_000) {
        // "duoi 500" in shopping context usually means 500k
        base *= 1_000;
      }

      return Math.round(base);
    }

    return null;
  }

  private async findRelevantProducts(message: string, productId?: string, maxPrice?: number): Promise<Product[]> {
    if (productId) {
      const focused = await this.productRepo.findOne({
        where: { id: productId },
        relations: ['category', 'brandEntity', 'images', 'variants'],
      });
      if (focused) {
        const focusedPrice = this.normalizeNumber(focused.price);
        if (!maxPrice || focusedPrice <= maxPrice) {
          return [focused];
        }
      }
    }

    const tokens = message
      .toLowerCase()
      .replace(/[^a-z0-9\s\u00c0-\u1ef9]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2)
      .slice(0, 6);

    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brandEntity', 'brandEntity')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.variants', 'variants')
      .where('product.status = :status', { status: 'ACTIVE' })
      .take(8);

    if (this.prefersLowPrice(message)) {
      qb.orderBy('product.price', 'ASC');
    } else {
      qb.orderBy('product.createdAt', 'DESC');
    }

    if (maxPrice && maxPrice > 0) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    if (tokens.length > 0) {
      const searchConditions = tokens.map(
        (_, idx) => `(LOWER(product.name) LIKE :kw${idx} OR LOWER(product.description) LIKE :kw${idx})`,
      );
      qb.andWhere(searchConditions.join(' OR '));
      tokens.forEach((tk, idx) => {
        qb.setParameter(`kw${idx}`, `%${tk}%`);
      });
    }

    const products = await qb.getMany();
    if (products.length > 0) return products;

    return this.findFallbackProductsByBudget(maxPrice);
  }

  private async findFallbackProductsByBudget(maxPrice?: number): Promise<Product[]> {
    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brandEntity', 'brandEntity')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.variants', 'variants')
      .where('product.status = :status', { status: 'ACTIVE' })
      .orderBy('product.price', 'ASC')
      .take(5);

    if (maxPrice && maxPrice > 0) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    return qb.getMany();
  }

  private buildProductContext(products: Product[]): string {
    return products
      .slice(0, 5)
      .map((p, idx) => {
        const category = p.category?.name || 'Khong ro';
        const brand = p.brandEntity?.name || p.brand || 'Khong ro';
        const price = this.normalizeNumber(p.price);
        const displayPrice = new Intl.NumberFormat('vi-VN').format(price);
        const image = p.images?.find((img) => img.isMain)?.imageUrl || p.image || 'Khong co';
        const variantCount = p.variants?.length || 0;
        const shortDesc = (p.description || '').replace(/\s+/g, ' ').trim().slice(0, 220);

        return [
          `${idx + 1}. Ten: ${p.name}`,
          `- ID: ${p.id}`,
          `- Gia niem yet: ${displayPrice} VND`,
          `- Thuong hieu: ${brand}`,
          `- Danh muc: ${category}`,
          `- So bien the: ${variantCount}`,
          `- Mo ta ngan: ${shortDesc || 'Khong co mo ta'}`,
          `- Anh: ${image}`,
        ].join('\n');
      })
      .join('\n\n');
  }

  private compactAiText(text: string): string {
    const normalized = (text || '')
      .replace(/\*\*/g, '')
      .replace(/\t+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!normalized) return normalized;

    const lines = normalized
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 8);

    const compact = lines.join('\n');
    if (compact.length <= 700) return compact;
    return `${compact.slice(0, 697).trim()}...`;
  }

  private makePromptCacheKey(userMessage: string, maxPrice?: number, productId?: string): string {
    const normalizedMsg = (userMessage || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
    return [normalizedMsg, maxPrice || 0, productId || 'none'].join('|');
  }

  private getCachedAiResponse(cacheKey: string): string | null {
    const hit = this.aiResponseCache.get(cacheKey);
    if (!hit) return null;
    if (Date.now() > hit.expiresAt) {
      this.aiResponseCache.delete(cacheKey);
      return null;
    }
    return hit.text;
  }

  private setCachedAiResponse(cacheKey: string, text: string) {
    if (!text) return;
    this.aiResponseCache.set(cacheKey, {
      text,
      expiresAt: Date.now() + this.cacheTtlMs,
    });
  }

  private async callGemini(prompt: string): Promise<string | null> {
    const now = Date.now();
    if (now < this.geminiCooldownUntil) {
      this.lastGeminiIssue = 'quota';
      return null;
    }

    const apiKey =
      this.configService.get<string>('GEMINI_API_KEY') ||
      this.configService.get<string>('Gemini_API_KEY');

    if (!apiKey) {
      this.logger.warn('Gemini API key is missing in environment variables.');
      this.lastGeminiIssue = 'model';
      return null;
    }

    const configuredModel = this.configService.get<string>('GEMINI_MODEL');
    const forceFallback = String(this.configService.get<string>('GEMINI_FORCE_FALLBACK') || '')
      .toLowerCase()
      .trim();
    if (forceFallback === '1' || forceFallback === 'true' || forceFallback === 'yes') {
      this.lastGeminiIssue = 'other';
      return null;
    }
    const uniqueModels = new Set<string>();
    const pushModel = (m?: string) => {
      const v = (m || '').trim();
      if (v) uniqueModels.add(v);
    };

    pushModel(configuredModel);
    pushModel('gemini-2.0-flash-lite');
    pushModel('gemini-2.0-flash');
    pushModel('gemini-1.5-flash-latest');
    pushModel('gemini-1.5-flash');
    pushModel('gemini-1.5-flash-8b');

    const modelCandidates = Array.from(uniqueModels);

    const versions = ['v1beta', 'v1'];
    let sawModelNotFound = false;

    for (const version of versions) {
      for (const model of modelCandidates) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
          const { data } = await axios.post(
            endpoint,
            {
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 700,
              },
            },
            { timeout: 20000 },
          );

          const parts = data?.candidates?.[0]?.content?.parts;
          if (!Array.isArray(parts)) continue;

          const text = parts
            .map((part: any) => (typeof part?.text === 'string' ? part.text : ''))
            .join('\n')
            .trim();

          if (text) return text;
        } catch (error: any) {
          const status = error?.response?.status;
          // 404 often means model/version mismatch. Try next fallback.
          if (status === 404) {
            sawModelNotFound = true;
            continue;
          }

          // 429 means quota exceeded/rate limit; skip Gemini for a short cooldown window.
          if (status === 429) {
            const retryAfterRaw = Number(error?.response?.headers?.['retry-after']);
            const envCooldown = Number(this.configService.get<string>('GEMINI_COOLDOWN_SECONDS') || 90);
            const defaultCooldownMs = Number.isFinite(envCooldown) && envCooldown > 0 ? envCooldown * 1000 : 90_000;
            const retryAfterMs = Number.isFinite(retryAfterRaw) && retryAfterRaw > 0 ? retryAfterRaw * 1000 : defaultCooldownMs;
            this.geminiCooldownUntil = Date.now() + retryAfterMs;
            this.lastGeminiIssue = 'quota';
            this.logger.warn(`Gemini rate-limited (429). Cooldown ${Math.round(retryAfterMs / 1000)}s before retry.`);
            return null;
          }

          this.logger.error(`Gemini request failed at ${version}/${model}: ${error?.message || error}`);
          this.lastGeminiIssue = 'other';
        }
      }
    }

    if (sawModelNotFound) {
      this.lastGeminiIssue = 'model';
      this.logger.warn('Gemini models are not available for current key/project. Using deterministic fallback.');
    }

    return null;
  }

  private buildFallbackAnswer(
    products: Product[],
    userQuestion: string,
    maxPrice?: number,
    aiIssue: 'none' | 'quota' | 'model' | 'other' = 'none',
  ): string {
    const cheapestIntent = this.isCheapestIntent(userQuestion);
    const highestIntent = this.isHighestPriceIntent(userQuestion);
    const bestSellingIntent = this.isBestSellingIntent(userQuestion);
    const flashSaleIntent = this.isFlashSaleIntent(userQuestion);

    if (products.length === 0) {
      if (maxPrice && maxPrice > 0) {
        const budgetText = new Intl.NumberFormat('vi-VN').format(maxPrice);
        return `Khong co san pham nao trong shop cua chung toi voi gia duoi ${budgetText} VND.`;
      }

      return 'Khong tim thay san pham phu hop trong shop cua chung toi voi yeu cau hien tai.';
    }

    if (cheapestIntent) {
      const first = products[0];
      const firstPrice = new Intl.NumberFormat('vi-VN').format(this.normalizeNumber(first.price));
      const next = products.slice(1, 3).map((p) => {
        const price = new Intl.NumberFormat('vi-VN').format(this.normalizeNumber(p.price));
        return `- ${p.name} - ${price} VND`;
      });

      return [
        `San pham re nhat hien tai trong shop cua chung toi: ${first.name} - ${firstPrice} VND.`,
        next.length > 0 ? 'San pham re tiep theo:' : null,
        ...next,
      ]
        .filter(Boolean)
        .join('\n');
    }

    if (highestIntent) {
      const first = products[0];
      const firstPrice = new Intl.NumberFormat('vi-VN').format(this.normalizeNumber(first.price));
      const next = products.slice(1, 3).map((p) => {
        const price = new Intl.NumberFormat('vi-VN').format(this.normalizeNumber(p.price));
        return `- ${p.name} - ${price} VND`;
      });

      return [
        `San pham gia cao nhat hien tai trong shop cua chung toi: ${first.name} - ${firstPrice} VND.`,
        next.length > 0 ? 'San pham gia cao tiep theo:' : null,
        ...next,
      ]
        .filter(Boolean)
        .join('\n');
    }

    if (bestSellingIntent) {
      const top = products.slice(0, 3).map((p, idx) => {
        const price = new Intl.NumberFormat('vi-VN').format(this.normalizeNumber(p.price));
        return `${idx + 1}) ${p.name} - ${price} VND`;
      });

      return ['San pham ban chay nhat hien tai trong shop cua chung toi:', ...top].join('\n');
    }

    if (flashSaleIntent) {
      if (products.length === 0) {
        return 'Hien tai shop cua chung toi chua co san pham flash sale dang dien ra.';
      }

      const top = products.slice(0, 5).map((p, idx) => {
        const price = new Intl.NumberFormat('vi-VN').format(this.normalizeNumber(p.price));
        return `${idx + 1}) ${p.name} - Gia niem yet ${price} VND`;
      });

      return ['San pham flash sale dang dien ra trong shop cua chung toi:', ...top].join('\n');
    }

    const suggested = products.slice(0, 3).map((p, index) => {
      const price = new Intl.NumberFormat('vi-VN').format(this.normalizeNumber(p.price));
      return `${index + 1}) ${p.name} - ${price} VND`;
    });

    return [
      maxPrice && maxPrice > 0
        ? `San pham dung muc gia duoi ${new Intl.NumberFormat('vi-VN').format(maxPrice)} VND trong shop cua chung toi:`
        : 'San pham phu hop trong shop cua chung toi:',
      ...suggested,
    ]
      .filter(Boolean)
      .join('\n');
  }

  async askAiAboutProducts(userId: string, message: string, productId?: string) {
    const trimmedMessage = (message || '').trim();
    if (!trimmedMessage) {
      throw new BadRequestException('No message provided');
    }

    const savedUserMessage = await this.chatMessageRepo.save(
      this.chatMessageRepo.create({
        userId,
        message: trimmedMessage,
        sender: 'user',
        isRead: false,
      }),
    );

    const maxPrice = this.extractBudgetFromMessage(trimmedMessage);
    const cheapestIntent = this.isCheapestIntent(trimmedMessage);
    const highestIntent = this.isHighestPriceIntent(trimmedMessage);
    const bestSellingIntent = this.isBestSellingIntent(trimmedMessage);
    const flashSaleIntent = this.isFlashSaleIntent(trimmedMessage);
    const cacheKey = this.makePromptCacheKey(trimmedMessage, maxPrice || undefined, productId);
    const cachedText = this.getCachedAiResponse(cacheKey);

    if (cachedText) {
      const savedAiMessage = await this.chatMessageRepo.save(
        this.chatMessageRepo.create({
          userId,
          message: cachedText,
          sender: 'admin',
          isRead: false,
        }),
      );

      return {
        message: 'AI da phan hoi thanh cong (cache)',
        data: {
          userMessage: savedUserMessage,
          aiMessage: savedAiMessage,
          matchedProducts: [],
        },
      };
    }

    let products = cheapestIntent
      ? await this.findFallbackProductsByBudget(maxPrice || undefined)
      : highestIntent
        ? await this.findHighestPriceProducts(3)
        : bestSellingIntent
          ? await this.findBestSellingProducts(3)
          : flashSaleIntent
            ? await this.findActiveFlashSaleProducts(5)
          : await this.findRelevantProducts(trimmedMessage, productId, maxPrice || undefined);
    if (products.length === 0) {
      products = bestSellingIntent
        ? await this.findFallbackProductsByBudget(maxPrice || undefined)
        : await this.findFallbackProductsByBudget(maxPrice || undefined);
    }
    const productContext = this.buildProductContext(products);

    const shouldBypassAi =
      cheapestIntent || highestIntent || bestSellingIntent || flashSaleIntent || this.prefersLowPrice(trimmedMessage);

    const prompt = [
      'Ban la tro ly AI cua website thuong mai dien tu. Nhiem vu la ho tro khach hang tim hieu san pham.',
      'Nguyen tac tra loi:',
      ...this.conciseRules.map((rule) => `- ${rule}`),
      '- Uu tien thong tin co trong du lieu san pham duoi day. Khong duoc tu tao thong tin khong co du lieu.',
      '- Neu khach co ngan sach (vi du: duoi 500000), chi de xuat san pham co gia <= ngan sach do.',
      '- Neu cau hoi ngoai pham vi san pham/mua hang, lich su don hang, thanh toan hoac van chuyen, hay lich su chat, thi lich su tu choi nhe nhang va dieu huong ve san pham.',
      '- Neu hop ly, hay de xuat toi da 3 san pham phu hop va neu ly do de xuat.',
      '',
      'Format bat buoc (giu nguyen cau truc):',
      '1) Tom tat: 1 cau ngan nhat.',
      '2) Goi y: toi da 3 dong, moi dong theo mau "- Ten | Gia | Ly do ngan".',
      '3) Hoi tiep: 1 cau hoi ngan de lam ro nhu cau.',
      '',
      `Cau hoi khach hang: ${trimmedMessage}`,
      maxPrice && maxPrice > 0 ? `Ngan sach toi da khach de cap: ${new Intl.NumberFormat('vi-VN').format(maxPrice)} VND` : '',
      '',
      'Du lieu san pham trong he thong:',
      productContext || 'Khong co du lieu san pham.',
    ].join('\n');

    this.lastGeminiIssue = 'none';
    const aiTextRaw = shouldBypassAi
      ? this.buildFallbackAnswer(products, trimmedMessage, maxPrice || undefined, 'none')
      : (await this.callGemini(prompt)) ||
        this.buildFallbackAnswer(products, trimmedMessage, maxPrice || undefined, this.lastGeminiIssue);
    const aiText = this.compactAiText(aiTextRaw);
    this.setCachedAiResponse(cacheKey, aiText);

    const savedAiMessage = await this.chatMessageRepo.save(
      this.chatMessageRepo.create({
        userId,
        message: aiText,
        sender: 'admin',
        isRead: false,
      }),
    );

    return {
      message: 'AI da phan hoi thanh cong',
      data: {
        userMessage: savedUserMessage,
        aiMessage: savedAiMessage,
        matchedProducts: products.slice(0, 5).map((p) => ({
          id: p.id,
          name: p.name,
          price: this.normalizeNumber(p.price),
          image: p.images?.find((img) => img.isMain)?.imageUrl || p.image || null,
        })),
      },
    };
  }

  // User gửi tin nhắn
  async sendMessage(userId: string, message: string, imageUrl?: string) {
    const chatMessage = this.chatMessageRepo.create({
      userId,
      message,
      imageUrl,
      sender: 'user',
      isRead: false,
    });

    const saved = await this.chatMessageRepo.save(chatMessage);
    return { message: 'Tin nhắn đã được gửi', data: saved };
  }

  // Admin reply tin nhắn
  async adminReply(userId: string, message: string, imageUrl?: string) {
    const chatMessage = this.chatMessageRepo.create({
      userId,
      message,
      imageUrl,
      sender: 'admin',
      isRead: false,
    });

    await this.chatMessageRepo.save(chatMessage);
    return { message: 'Phản hồi đã được gửi', data: chatMessage };
  }

  // Lấy lịch sử chat của 1 user
  async getChatHistory(userId: string) {
    const messages = await this.chatMessageRepo.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    return messages;
  }

  // Admin: Lấy danh sách tất cả conversations (grouped by user)
  async getAllConversations() {
    const rawMessages = await this.chatMessageRepo
      .createQueryBuilder('msg')
      .leftJoin('msg.user', 'user')
      .select('msg.userId', 'userId')
      .addSelect('user.name', 'userName')
      .addSelect('user.email', 'userEmail')
      .addSelect('MAX(msg.createdAt)', 'lastMessageAt')
      .addSelect('COUNT(CASE WHEN msg.sender = \'user\' AND msg.isRead = false THEN 1 END)', 'unreadCount')
      .groupBy('msg.userId')
      .addGroupBy('user.name')
      .addGroupBy('user.email')
      .orderBy('lastMessageAt', 'DESC')
      .getRawMany();

    return rawMessages;
  }

  // Đánh dấu tin nhắn đã đọc
  async markAsRead(userId: string) {
    await this.chatMessageRepo.update(
      { userId, sender: 'user', isRead: false },
      { isRead: true },
    );
    return { message: 'Đã đánh dấu tin nhắn là đã đọc' };
  }

  // Lấy số lượng tin nhắn chưa đọc (cho admin)
  async getUnreadCount() {
    const count = await this.chatMessageRepo.count({
      where: { sender: 'user', isRead: false },
    });
    return { count };
  }

  // Upload ảnh chat lên Cloudinary
  async uploadChatImage(file: Express.Multer.File): Promise<{ imageUrl: string }> {
    if (!file) {
      throw new Error('No file provided');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'chat-images',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({ imageUrl: result.secure_url });
          } else {
            reject(new Error('Upload failed'));
          }
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  
}