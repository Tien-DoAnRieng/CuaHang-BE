import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import axios from 'axios';
import { ChatMessage } from '../../shared/schemas/chat-message.entity';
import { User } from '../../shared/schemas/entities/user.entity';
import { Product } from '../../shared/schemas/entities/product.entity';
import { OrderItem } from '../../shared/schemas/entities/order-item.entity';
import { FlashSale } from '../../shared/schemas/entities/flash-sale.entity';
import { Faq } from '../../shared/schemas/entities/faq.entity';
import { AiConfig } from '../../shared/schemas/entities/ai-config.entity';
import { ConfigService } from '@nestjs/config';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { v2 as cloudinary } from 'cloudinary';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { UpdateAiConfigDto } from './dto/update-ai-config.dto';
const streamifier = require('streamifier');

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private geminiCooldownUntil = 0;
  private lastGeminiIssue: 'none' | 'quota' | 'model' | 'other' = 'none';
  private readonly aiResponseCache = new Map<string, { text: string; expiresAt: number }>();
  private readonly cacheTtlMs = 5 * 60 * 1000;

  private readonly conciseRules = [
    'Trả lời đúng trọng tâm, ngắn gọn, súc tích, đi thẳng vào câu hỏi của khách hàng.',
    'Tuyệt đối KHÔNG thêm các câu chào mời dài dòng, không thêm câu upsell/quảng cáo ngoài lề, không hỏi thêm các câu tiếp thị sau danh sách.',
    'Khi liệt kê sản phẩm, chỉ nêu rõ tên và giá theo danh sách đánh số 1. 2. 3. 4. 5. gọn gàng, trực diện.',
    'Ưu tiên thông tin chính xác từ Cơ sở tri thức (FAQ) và dữ liệu sản phẩm trong hệ thống.',
    'Nếu khách hàng có nêu ngân sách, chỉ gợi ý các sản phẩm có giá đúng trong ngân sách.',
    'Xưng hô Dạ/Em thân thiện, lịch sự và luôn kết thúc câu trọn vẹn.',
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
    @InjectRepository(Faq)
    private readonly faqRepo: Repository<Faq>,
    @InjectRepository(AiConfig)
    private readonly aiConfigRepo: Repository<AiConfig>,
    private readonly configService: ConfigService,
  ) {}

  private normalizeNumber(value: unknown): number {
    if (typeof value === 'number') return value;
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  // ==========================================
  // 1. AI CONFIGURATION MANAGEMENT
  // ==========================================
  async getAiConfig(): Promise<AiConfig> {
    const existing = await this.aiConfigRepo.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });

    if (existing && existing.length > 0) return existing[0];

    // Create default configuration
    const defaultConfig = this.aiConfigRepo.create({
      systemInstruction:
        'Bạn là trợ lý AI trả lời trực diện, chính xác và ngắn gọn của cửa hàng. Bạn tập trung giải đáp đúng trọng tâm câu hỏi của khách hàng, không trả lời dài dòng và không thêm các câu chào mời upsale không cần thiết.',
      businessRules:
        '- Trả lời đúng trọng tâm câu hỏi, ngắn gọn, súc tích.\n- Tuyệt đối không thêm các câu chào mời upsale ngoài lề.\n- Khi liệt kê sản phẩm, trình bày trực diện dạng danh sách đánh số kèm giá tiền.',
      temperature: 0.3,
      maxHistoryTurns: 8,
      emergencyKeywords:
        'lừa đảo, khiếu nại, gặp nhân viên, trả hàng gấp, kiện, cướp, công an, bồi thường, gặp người thật, hỗ trợ người thật, thái độ tệ',
      isEnabled: true,
    });

    return this.aiConfigRepo.save(defaultConfig);
  }

  async updateAiConfig(dto: UpdateAiConfigDto): Promise<AiConfig> {
    const config = await this.getAiConfig();
    if (dto.systemInstruction !== undefined) config.systemInstruction = dto.systemInstruction;
    if (dto.businessRules !== undefined) config.businessRules = dto.businessRules;
    if (dto.temperature !== undefined) config.temperature = dto.temperature;
    if (dto.maxHistoryTurns !== undefined) config.maxHistoryTurns = dto.maxHistoryTurns;
    if (dto.emergencyKeywords !== undefined) config.emergencyKeywords = dto.emergencyKeywords;
    if (dto.isEnabled !== undefined) config.isEnabled = dto.isEnabled;

    return this.aiConfigRepo.save(config);
  }

  // ==========================================
  // 2. FAQ KNOWLEDGE BASE MANAGEMENT
  // ==========================================
  async getAllFaqs(category?: string, search?: string) {
    const query = this.faqRepo.createQueryBuilder('faq');

    if (category && category !== 'all') {
      query.andWhere('faq.category = :category', { category });
    }

    if (search && search.trim()) {
      query.andWhere(
        '(faq.question LIKE :search OR faq.answer LIKE :search OR faq.keywords LIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    query.orderBy('faq.createdAt', 'DESC');
    return query.getMany();
  }

  async createFaq(dto: CreateFaqDto) {
    const faq = this.faqRepo.create({
      question: dto.question.trim(),
      answer: dto.answer.trim(),
      category: dto.category || 'general',
      keywords: dto.keywords || '',
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });
    return this.faqRepo.save(faq);
  }

  async updateFaq(id: string, dto: UpdateFaqDto) {
    const faq = await this.faqRepo.findOne({ where: { id } });
    if (!faq) throw new NotFoundException('FAQ không tồn tại');

    if (dto.question !== undefined) faq.question = dto.question.trim();
    if (dto.answer !== undefined) faq.answer = dto.answer.trim();
    if (dto.category !== undefined) faq.category = dto.category;
    if (dto.keywords !== undefined) faq.keywords = dto.keywords;
    if (dto.isActive !== undefined) faq.isActive = dto.isActive;

    return this.faqRepo.save(faq);
  }

  async deleteFaq(id: string) {
    const result = await this.faqRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('FAQ không tồn tại');
    return { message: 'Đã xóa FAQ thành công' };
  }

  private removeVietnameseTones(str: string): string {
    return (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .trim();
  }

  // Thuật toán tìm kiếm FAQ liên quan để nạp vào prompt & trả lời tự động
  private async findRelevantFaqs(query: string, limit: number = 3): Promise<Faq[]> {
    try {
      const allFaqs = await this.faqRepo.find({ where: { isActive: true } });
      if (!allFaqs || allFaqs.length === 0) return [];

      const lowerQuery = query.toLowerCase().trim();
      const unaccentQuery = this.removeVietnameseTones(query);

      // Danh sách từ dừng phổ biến trong tiếng Việt không dùng để match lẻ tẻ
      const stopWords = new Set([
        'co', 'shop', 'la', 'va', 'cua', 'cho', 'minh', 'nhe', 'duoc', 'gi', 'khong', 
        'sao', 'nao', 'the', 'nhu', 'em', 'anh', 'chi', 'voi', 've', 'o', 'tai', 
        'nhung', 'cac', 'nay', 'do', 'ra', 'de', 'hay', 'mot', 'hai', 'ba', 'trong',
        'khi', 'qua', 'lai', 'nhe', 'nha', 'a', 'oi', 'tim', 'xem', 'hoi', 'biet'
      ]);

      const unaccentTokens = unaccentQuery
        .split(/[^a-z0-9]+/i)
        .filter((t) => t.length > 1 && !stopWords.has(t));

      const scored = allFaqs.map((faq) => {
        let score = 0;
        const qRaw = (faq.question || '').toLowerCase();
        const kwRaw = (faq.keywords || '').toLowerCase();
        const catRaw = (faq.category || '').toLowerCase();

        const qClean = this.removeVietnameseTones(qRaw);
        const kwClean = this.removeVietnameseTones(kwRaw);
        const catClean = this.removeVietnameseTones(catRaw);

        // 1. Khớp câu hỏi hoàn chỉnh hoặc cụm từ dài
        if (qRaw.includes(lowerQuery) || lowerQuery.includes(qRaw)) score += 40;
        if (qClean.includes(unaccentQuery) || unaccentQuery.includes(qClean)) score += 35;

        // 2. Khớp cụm từ khóa (keywords)
        const kwItems = kwRaw.split(/[,;]+/).map((k) => k.trim()).filter((k) => k.length > 1);
        for (const kw of kwItems) {
          const kwUnaccent = this.removeVietnameseTones(kw);
          if (lowerQuery.includes(kw) || unaccentQuery.includes(kwUnaccent)) {
            score += 25;
          }
        }

        // 3. Khớp danh mục
        if (catRaw && lowerQuery.includes(catRaw)) score += 15;
        if (catClean && unaccentQuery.includes(catClean)) score += 12;

        // 4. Khớp các từ khóa ý nghĩa (đã loại bỏ từ dừng)
        unaccentTokens.forEach((token) => {
          if (qClean.includes(token)) score += 4;
          if (kwClean.includes(token)) score += 5;
        });

        return { faq, score };
      });

      return scored
        .filter((item) => item.score >= 15)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((item) => item.faq);
    } catch (error) {
      this.logger.warn('Error fetching relevant FAQs:', error);
      return [];
    }
  }

  // ==========================================
  // 3. CONVERSATION MEMORY & HITL HELPERS
  // ==========================================
  private async getRecentConversationMemory(userId: string, maxTurns: number = 8): Promise<string> {
    try {
      const recentMessages = await this.chatMessageRepo.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: maxTurns,
      });

      if (!recentMessages || recentMessages.length === 0) return '';

      // Đảo ngược về thứ tự thời gian từ cũ tới mới
      const chronological = recentMessages.reverse();
      return chronological
        .map((msg) => {
          const role = msg.sender === 'user' ? 'Khách' : 'Trợ lý AI';
          return `${role}: ${msg.message}`;
        })
        .join('\n');
    } catch (error) {
      this.logger.warn('Error retrieving conversation memory:', error);
      return '';
    }
  }

  private checkHitlKeywords(message: string, customEmergencyKeywords?: string): boolean {
    if (!message) return false;
    const unaccent = this.removeVietnameseTones(message.toLowerCase());

    // 1. Handover Intent Regex Patterns: bao quát mọi biến thể chat với người thật, nhân viên, shop
    const handoverPatterns = [
      /\b(chat|noi chuyen|gap|can gap|cho gap|lien he|ket noi|chuyen|chuyen sang)\s+(voi\s+)?(nhan vien|tu van vien|nguoi that|admin|shop|quan ly|chuyen vien)\b/i,
      /\b(nhan vien|tu van vien|chuyen vien|admin)\s+(ho tro|tu van|tiep quan|cham soc)\b/i,
      /\b(chat voi shop|chat voi nguoi that|noi chuyen nguoi that|gap nguoi that|ho tro nguoi that)\b/i,
      /\b(muon gap nhan vien|muon chat voi nhan vien|cho toi gap nhan vien|cho minh gap nhan vien|muon gap admin)\b/i,
      /\b(tu van vien|chuyen vien tu van|nhan vien cham soc|nhan vien ho tro)\b/i,
      /\b(lua dao|khieu nai|boi thuong|kien|cong an|thai do te|doi tra gap|huy don khan cap|hoan tien gap)\b/i,
    ];

    for (const pattern of handoverPatterns) {
      if (pattern.test(unaccent)) return true;
    }

    // 2. Custom emergency keywords from DB
    if (customEmergencyKeywords) {
      const customKeywords = customEmergencyKeywords
        .split(/[,;]+/)
        .map((k) => this.removeVietnameseTones(k.trim()))
        .filter(Boolean);
      for (const kw of customKeywords) {
        if (unaccent.includes(kw)) return true;
      }
    }

    return false;
  }

  async toggleTakeover(userId: string, isBotMuted: boolean) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User không tồn tại');

    user.isBotMuted = isBotMuted;
    await this.userRepo.save(user);

    return {
      message: isBotMuted
        ? 'Đã tiếp quản cuộc trò chuyện (AI tạm dừng phản hồi tự động)'
        : 'Đã bàn giao lại cuộc trò chuyện cho AI',
      userId,
      isBotMuted,
    };
  }

  async getAiConversations() {
    const rawConversations = await this.chatMessageRepo
      .createQueryBuilder('msg')
      .leftJoin('msg.user', 'user')
      .select('msg.userId', 'userId')
      .addSelect('user.name', 'userName')
      .addSelect('user.email', 'userEmail')
      .addSelect('user.isBotMuted', 'isBotMuted')
      .addSelect('MAX(msg.createdAt)', 'lastMessageAt')
      .addSelect(
        "COUNT(CASE WHEN msg.sender = 'user' AND msg.isRead = false THEN 1 END)",
        'unreadCount',
      )
      .groupBy('msg.userId')
      .addGroupBy('user.name')
      .addGroupBy('user.email')
      .addGroupBy('user.isBotMuted')
      .orderBy('lastMessageAt', 'DESC')
      .getRawMany();

    return rawConversations;
  }

  // ==========================================
  // 4. PRODUCT INTENT & SEARCH HELPERS
  // ==========================================
  private readonly categoryKeywords: Record<string, string> = {
    'dien thoai': 'Điện Thoại',
    'smartphone': 'Điện Thoại',
    'phone': 'Điện Thoại',
    'tablet': 'Tablet',
    'may tinh bang': 'Tablet',
    'ipad': 'Tablet',
    'laptop': 'Laptop & PC',
    'may tinh': 'Laptop & PC',
    'pc': 'Laptop & PC',
    'macbook': 'Laptop & PC',
    'thoi trang nam': 'Thời trang Nam',
    'do nam': 'Thời trang Nam',
    'thoi trang nu': 'Thời trang Nữ',
    'do nu': 'Thời trang Nữ',
    'suc khoe': 'Sức khỏe & Làm đẹp',
    'lam dep': 'Sức khỏe & Làm đẹp',
    'my pham': 'Sức khỏe & Làm đẹp',
    'nha cua': 'Nhà cửa & Đời sống',
    'doi song': 'Nhà cửa & Đời sống',
    'gia dung': 'Nhà cửa & Đời sống',
    'dong ho': 'Đồng hồ & Phụ kiện',
    'phu kien': 'Đồng hồ & Phụ kiện',
    'gaming': 'Gaming & Gears',
    'gears': 'Gaming & Gears',
    'dien tu': 'Điện Tử',
  };

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

  private extractRequestedLimit(message: string): number {
    const text = (message || '').toLowerCase();
    const match = text.match(
      /(?:top\s*|danh\s*sach\s*|cho\s*(?:toi|minh|em)\s*)?(\d+)\s*(?:san\s*pham|sp|dien\s*thoai|laptop|mau|cai|chiec|mon|item|dong\s*may)?/i,
    );
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 20) return num;
    }
    return 5;
  }

  private extractCategoryFromMessage(message: string): string | undefined {
    const unaccent = this.removeVietnameseTones(message);
    const keys = Object.keys(this.categoryKeywords).sort((a, b) => b.length - a.length);
    for (const key of keys) {
      if (new RegExp(`\\b${key}\\b`, 'i').test(unaccent)) {
        return this.categoryKeywords[key];
      }
    }
    return undefined;
  }

  private cleanSearchKeyword(message: string): string {
    const stopWords = [
      'cho', 'toi', 'em', 'minh', 'ban', 'shop', 'ad', 'admin', 'oi', 'nhe', 'nha', 'a',
      'san pham', 'sp', 'loai', 'mau', 'chiec', 'cai', 'mon', 'hang',
      'co', 'gia', 're', 'thap', 'cao', 'dat', 'nhat', 'tam', 'khoang',
      'tu van', 'tim', 'kiem', 'mua', 'can', 'xem', 'hoi', 'gioi thieu', 'goi y',
      'top', 'nao', 'gi', 'duoi', 'tren', 'tot', 'chay', 'soc', 'dang', 'giam', 'khuyen mai',
      'chat', 'nhan vien', 'nguoi that', 'tu van vien', 'noi chuyen', 'gap', 'lien he', 'chuyen sang', 'chuyen', 'ket noi', 'muon', 'voi',
    ];
    let cleaned = this.removeVietnameseTones(message);
    cleaned = cleaned.replace(/\b\d+\b/g, ' ');
    for (const sw of stopWords) {
      const reg = new RegExp(`\\b${sw}\\b`, 'gi');
      cleaned = cleaned.replace(reg, ' ');
    }
    return cleaned.replace(/\s+/g, ' ').trim();
  }

  private extractQueryCriteria(message: string, productId?: string) {
    const limit = this.extractRequestedLimit(message);
    const category = this.extractCategoryFromMessage(message);
    const maxPrice = this.extractBudgetFromMessage(message);

    let sortBy: 'price_asc' | 'price_desc' | 'best_selling' | 'newest' | 'flash_sale' = 'newest';
    if (this.isCheapestIntent(message) || this.prefersLowPrice(message)) {
      sortBy = 'price_asc';
    } else if (this.isHighestPriceIntent(message)) {
      sortBy = 'price_desc';
    } else if (this.isBestSellingIntent(message)) {
      sortBy = 'best_selling';
    } else if (this.isFlashSaleIntent(message)) {
      sortBy = 'flash_sale';
    }

    let cleanedKeyword = this.cleanSearchKeyword(message);

    // If a category was matched, remove all category trigger terms from cleanedKeyword
    // so words like "máy tính bảng" or "điện thoại" don't become search keywords against product.name!
    if (category) {
      for (const [key, val] of Object.entries(this.categoryKeywords)) {
        if (val === category) {
          cleanedKeyword = cleanedKeyword.replace(new RegExp(`\\b${key}\\b`, 'gi'), ' ');
        }
      }
      cleanedKeyword = cleanedKeyword.replace(/\s+/g, ' ').trim();
    }

    return {
      limit,
      category,
      maxPrice: maxPrice || undefined,
      sortBy,
      keyword: cleanedKeyword || undefined,
      productId,
    };
  }

  async executeSearchProducts(params: {
    keyword?: string;
    category?: string;
    brand?: string;
    sortBy?: 'price_asc' | 'price_desc' | 'best_selling' | 'newest' | 'flash_sale';
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
    productId?: string;
  }): Promise<Product[]> {
    const limit = Math.min(Math.max(params.limit || 5, 1), 20);

    if (params.productId) {
      const direct = await this.productRepo.findOne({
        where: { id: params.productId, status: 'ACTIVE' },
        relations: ['category', 'brandEntity', 'images', 'variants'],
      });
      if (direct) return [direct];
    }

    // 1. Flash sale specific
    if (params.sortBy === 'flash_sale') {
      const flashProducts = await this.findActiveFlashSaleProducts(limit * 2);
      if (flashProducts.length > 0) {
        let filtered = flashProducts;
        if (params.category) {
          const catNorm = this.removeVietnameseTones(params.category);
          filtered = filtered.filter(
            (p) => p.category && this.removeVietnameseTones(p.category.name).includes(catNorm),
          );
        }
        if (params.keyword) {
          const kwNorm = this.removeVietnameseTones(params.keyword);
          filtered = filtered.filter((p) => this.removeVietnameseTones(p.name).includes(kwNorm));
        }
        if (filtered.length > 0) return filtered.slice(0, limit);
        return flashProducts.slice(0, limit);
      }
    }

    // 2. Best selling specific
    if (params.sortBy === 'best_selling') {
      const bestSelling = await this.findBestSellingProducts(limit * 2);
      if (bestSelling.length > 0) {
        let filtered = bestSelling;
        if (params.category) {
          const catNorm = this.removeVietnameseTones(params.category);
          filtered = filtered.filter(
            (p) => p.category && this.removeVietnameseTones(p.category.name).includes(catNorm),
          );
        }
        if (params.brand) {
          const brandNorm = this.removeVietnameseTones(params.brand);
          filtered = filtered.filter(
            (p) => p.brandEntity && this.removeVietnameseTones(p.brandEntity.name).includes(brandNorm),
          );
        }
        if (params.maxPrice && params.maxPrice > 0) {
          filtered = filtered.filter((p) => this.normalizeNumber(p.price) <= params.maxPrice!);
        }
        if (params.keyword) {
          const kwNorm = this.removeVietnameseTones(params.keyword);
          filtered = filtered.filter(
            (p) =>
              this.removeVietnameseTones(p.name).includes(kwNorm) ||
              (p.description && this.removeVietnameseTones(p.description).includes(kwNorm)),
          );
        }
        if (filtered.length > 0) return filtered.slice(0, limit);
      }
    }

    // 3. Main query
    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brandEntity', 'brandEntity')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.variants', 'variants')
      .where('product.status = :status', { status: 'ACTIVE' });

    if (params.category && params.category.trim()) {
      const cat = params.category.trim();
      qb.andWhere('(category.name LIKE :catName OR category.description LIKE :catName)', {
        catName: `%${cat}%`,
      });
    }

    if (params.brand && params.brand.trim()) {
      qb.andWhere('brandEntity.name LIKE :brandName', {
        brandName: `%${params.brand.trim()}%`,
      });
    }

    if (params.minPrice && params.minPrice > 0) {
      qb.andWhere('product.price >= :minPrice', { minPrice: params.minPrice });
    }
    if (params.maxPrice && params.maxPrice > 0) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice: params.maxPrice });
    }

    if (params.keyword && params.keyword.trim()) {
      const kw = params.keyword.trim();
      const tokens = kw.split(/\s+/).filter((t) => t.length > 1);

      if (tokens.length <= 1) {
        qb.andWhere(
          '(product.name LIKE :kw OR product.description LIKE :kw OR category.name LIKE :kw OR brandEntity.name LIKE :kw)',
          { kw: `%${kw}%` },
        );
      } else {
        qb.andWhere(
          `(product.name LIKE :fullKw OR product.description LIKE :fullKw OR ` +
            tokens
              .map((_, i) => `product.name LIKE :k${i} OR brandEntity.name LIKE :k${i}`)
              .join(' OR ') +
            `)`,
          {
            fullKw: `%${kw}%`,
            ...tokens.reduce((acc, t, i) => ({ ...acc, [`k${i}`]: `%${t}%` }), {}),
          },
        );
      }
    }

    if (params.sortBy === 'price_asc') {
      qb.orderBy('product.price', 'ASC');
    } else if (params.sortBy === 'price_desc') {
      qb.orderBy('product.price', 'DESC');
    } else if (params.sortBy === 'newest') {
      qb.orderBy('product.createdAt', 'DESC');
    } else {
      qb.orderBy('product.createdAt', 'DESC');
    }

    const results = await qb.take(limit).getMany();
    if (results.length > 0) return results;

    // Fallback relaxation if keyword was too restrictive with category
    if (params.category && params.keyword) {
      const relaxTokens = params.keyword.split(/\s+/).filter((t) => t.length > 1);
      const relaxQb = this.productRepo
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.brandEntity', 'brandEntity')
        .leftJoinAndSelect('product.images', 'images')
        .leftJoinAndSelect('product.variants', 'variants')
        .where('product.status = :status', { status: 'ACTIVE' })
        .andWhere('(category.name LIKE :catName OR category.description LIKE :catName)', {
          catName: `%${params.category.trim()}%`,
        });

      if (relaxTokens.length > 0) {
        relaxQb.andWhere(
          relaxTokens.map((_, i) => `product.name LIKE :rt${i}`).join(' OR '),
          relaxTokens.reduce((acc, t, i) => ({ ...acc, [`rt${i}`]: `%${t}%` }), {}),
        );
      }

      if (params.sortBy === 'price_asc') relaxQb.orderBy('product.price', 'ASC');
      else if (params.sortBy === 'price_desc') relaxQb.orderBy('product.price', 'DESC');
      else relaxQb.orderBy('product.createdAt', 'DESC');

      const relaxResults = await relaxQb.take(limit).getMany();
      if (relaxResults.length > 0) return relaxResults;
    }

    // If category was specified and still no results (e.g. price/keyword was too strict),
    // query products strictly WITHIN THAT CATEGORY!
    if (params.category && params.category.trim()) {
      const catOnlyQb = this.productRepo
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.brandEntity', 'brandEntity')
        .leftJoinAndSelect('product.images', 'images')
        .leftJoinAndSelect('product.variants', 'variants')
        .where('product.status = :status', { status: 'ACTIVE' })
        .andWhere('(category.name LIKE :catName OR category.description LIKE :catName)', {
          catName: `%${params.category.trim()}%`,
        });

      if (params.sortBy === 'price_asc') catOnlyQb.orderBy('product.price', 'ASC');
      else if (params.sortBy === 'price_desc') catOnlyQb.orderBy('product.price', 'DESC');
      else catOnlyQb.orderBy('product.createdAt', 'DESC');

      const catResults = await catOnlyQb.take(limit).getMany();
      if (catResults.length > 0) return catResults;
      return [];
    }

    // Only return general budget products if NEITHER category NOR keyword was specified!
    if (!params.category && !params.keyword) {
      return this.findFallbackProductsByBudget(params.maxPrice, limit);
    }

    return [];
  }

  private async findHighestPriceProducts(limit: number = 10): Promise<Product[]> {
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
      .addSelect('SUM(oi.quantity)', 'totalSold')
      .groupBy('p.id')
      .orderBy('totalSold', 'DESC')
      .limit(limit)
      .getRawMany();

    const productIds = rows.map((r) => r.productId).filter(Boolean);
    if (!productIds.length) return [];

    const products = await this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .leftJoinAndSelect('p.brandEntity', 'brandEntity')
      .leftJoinAndSelect('p.images', 'images')
      .leftJoinAndSelect('p.variants', 'variants')
      .where('p.id IN (:...productIds)', { productIds })
      .andWhere('p.status = :status', { status: 'ACTIVE' })
      .getMany();

    const rankMap = new Map<string, number>(productIds.map((id, index) => [id, index]));
    return products.sort((a, b) => (rankMap.get(a.id) ?? 999) - (rankMap.get(b.id) ?? 999));
  }

  private async findActiveFlashSaleProducts(limit: number = 5): Promise<Product[]> {
    const now = new Date();
    const flashSale = await this.flashSaleRepo.findOne({
      where: { isActive: true },
      relations: ['items', 'items.product', 'items.product.category', 'items.product.brandEntity', 'items.product.images'],
    });

    if (!flashSale || !flashSale.items?.length) return [];

    const isLive =
      (!flashSale.startTime || new Date(flashSale.startTime) <= now) &&
      (!flashSale.endTime || new Date(flashSale.endTime) >= now);

    if (!isLive) return [];

    return flashSale.items
      .map((item) => item.product)
      .filter((p): p is Product => Boolean(p && p.status === 'ACTIVE'))
      .slice(0, limit);
  }

  private async findFallbackProductsByBudget(maxPrice?: number, limit: number = 5): Promise<Product[]> {
    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brandEntity', 'brandEntity')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.variants', 'variants')
      .where('product.status = :status', { status: 'ACTIVE' });

    if (maxPrice && maxPrice > 0) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice });
      qb.orderBy('product.price', 'ASC');
    } else {
      qb.orderBy('product.price', 'ASC');
    }

    return qb.take(limit).getMany();
  }

  private async findRelevantProducts(message: string, productId?: string, maxPrice?: number): Promise<Product[]> {
    const criteria = this.extractQueryCriteria(message, productId);
    if (maxPrice && maxPrice > 0) criteria.maxPrice = maxPrice;
    return this.executeSearchProducts(criteria);
  }

  private extractBudgetFromMessage(message: string): number | null {
    const text = (message || '').toLowerCase();
    // Only match million if explicitly: triệu, trieu, tr, củ, cu, or standalone 'm' not followed by letters/digits
    // E.g.: "15m", "15tr", "15 triệu", "15 củ"
    // MUST NOT match "3 máy", "5 mẫu", "2 món", "4 mắt"...
    const millionMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:trieu|triệu|tr\b|củ\b|cu\b|(?:m(?![a-zà-ỹ0-9])))/iu);
    if (millionMatch) {
      const val = parseFloat(millionMatch[1].replace(',', '.'));
      if (Number.isFinite(val) && val > 0) return Math.round(val * 1_000_000);
    }

    const thousandMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:k\b|nghin|nghìn|ngan|ngàn)/iu);
    if (thousandMatch) {
      const val = parseFloat(thousandMatch[1].replace(',', '.'));
      if (Number.isFinite(val) && val > 0) return Math.round(val * 1_000);
    }

    const explicitNumberMatch = text.match(/\b(\d{1,3}(?:[.,]\d{3})+|\d{5,9})\s*(?:vnd|vnđ|đ)?\b/i);
    if (explicitNumberMatch) {
      const raw = explicitNumberMatch[1].replace(/[.,]/g, '');
      const parsed = parseInt(raw, 10);
      if (Number.isFinite(parsed) && parsed >= 10000) return parsed;
    }

    return null;
  }

  private buildProductContext(products: Product[]): string {
    if (!products.length) return 'Khong tim thay san pham phu hop trong database.';

    return products
      .map((p, idx) => {
        const brand = p.brandEntity?.name || 'Khong ro';
        const category = p.category?.name || 'Chung';
        const price = new Intl.NumberFormat('vi-VN').format(this.normalizeNumber(p.price));
        const shortDesc = (p.description || '').replace(/\s+/g, ' ').slice(0, 100);
        return `${idx + 1}. [ID: ${p.id}] ${p.name} | Danh muc: ${category} | Thuong hieu: ${brand} | Gia ban: ${price} VND | Mo ta: ${shortDesc}`;
      })
      .join('\n');
  }

  // ==========================================
  // 5. CALL GEMINI API WITH TOOL/FUNCTION CALLING
  // ==========================================
  private getProductSearchToolDefinition() {
    return {
      functionDeclarations: [
        {
          name: 'search_products',
          description: 'Tìm kiếm sản phẩm trong kho hàng theo từ khóa, danh mục, thương hiệu, khoảng giá và cách sắp xếp.',
          parameters: {
            type: 'OBJECT',
            properties: {
              keyword: { type: 'STRING', description: 'Từ khóa tên sản phẩm hoặc đặc điểm cần tìm (ví dụ: iphone, tai nghe, áo khoác)' },
              category: {
                type: 'STRING',
                description: 'Tên danh mục sản phẩm (ví dụ: Điện Thoại, Tablet, Laptop & PC, Thời trang Nam, Thời trang Nữ, Sức khỏe & Làm đẹp, Nhà cửa & Đời sống, Đồng hồ & Phụ kiện, Gaming & Gears, Điện Tử)',
              },
              brand: { type: 'STRING', description: 'Tên thương hiệu nếu có (ví dụ: Apple, Samsung, Xiaomi, Sony, Asus, L\'Oreal, Casio...)' },
              sortBy: {
                type: 'STRING',
                enum: ['price_asc', 'price_desc', 'best_selling', 'newest', 'flash_sale'],
                description: 'Cách sắp xếp: price_asc (giá thấp nhất/rẻ nhất), price_desc (giá cao nhất/đắt nhất), best_selling (bán chạy nhất), newest (mới nhất), flash_sale (khuyến mãi)',
              },
              minPrice: { type: 'NUMBER', description: 'Giá tối thiểu VND' },
              maxPrice: { type: 'NUMBER', description: 'Giá tối đa VND' },
              limit: { type: 'NUMBER', description: 'Số lượng sản phẩm cần lấy (mặc định 5, tối đa 20)' },
            },
          },
        },
      ],
    };
  }

  private async callGemini(
    prompt: string,
    systemInstruction?: string,
    temperature: number = 0.3,
    maxOutputTokens: number = 400,
  ): Promise<{ text: string; products?: Product[] } | null> {
    const now = Date.now();
    if (now < this.geminiCooldownUntil) {
      this.lastGeminiIssue = 'quota';
      const remainingSec = Math.ceil((this.geminiCooldownUntil - now) / 1000);
      this.logger.log(`Gemini dang trong thoi gian gian cach (con ${remainingSec}s)...`);
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

    const configuredModel = (this.configService.get<string>('GEMINI_MODEL') || 'gemini-flash-lite-latest').trim();
    const forceFallback = String(this.configService.get<string>('GEMINI_FORCE_FALLBACK') || '')
      .toLowerCase()
      .trim();
    if (forceFallback === '1' || forceFallback === 'true' || forceFallback === 'yes') {
      this.lastGeminiIssue = 'other';
      return null;
    }

    // Prioritize fast, low-latency models (~1.8s) first; heavier models as backup
    const modelCandidates = [
      configuredModel,
      'gemini-flash-lite-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.6-flash',
      'gemini-flash-latest',
    ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

    const tools = [this.getProductSearchToolDefinition()];

    for (const model of modelCandidates) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

        const requestBody: any = {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          tools,
          generationConfig: {
            temperature: Math.min(Math.max(temperature, 0), 1),
            maxOutputTokens,
          },
        };

        if (systemInstruction) {
          requestBody.systemInstruction = {
            parts: [{ text: systemInstruction }],
          };
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(6000),
        });

        if (response.status === 404) continue;

        if (response.status === 503) {
          this.logger.warn(`Gemini 503 (High Demand) at ${model}, chuyen sang model tiep theo...`);
          continue;
        }

        if (response.status === 429) {
          const cooldownDurationMs = 8000;
          this.geminiCooldownUntil = Date.now() + cooldownDurationMs;
          this.lastGeminiIssue = 'quota';
          this.logger.warn(`Gemini 429 (Rate Limit). Cooldown ${cooldownDurationMs / 1000}s.`);
          break;
        }

        if (!response.ok) {
          const errBody = await response.text();
          this.logger.warn(`Gemini response error at ${model}: ${response.status} - ${errBody.slice(0, 150)}`);
          continue;
        }

        const data: any = await response.json();
        const candidate = data?.candidates?.[0];
        const parts = candidate?.content?.parts;
        if (!Array.isArray(parts)) continue;

        // Check for functionCall (Tool Call)
        const fnPart = parts.find((p: any) => p.functionCall);
        if (fnPart && fnPart.functionCall) {
          const fnCall = fnPart.functionCall;
          let callProducts: Product[] = [];
          if (fnCall.name === 'search_products') {
            const args = { ...(fnCall.args || {}) };
            const extractedMax = this.extractBudgetFromMessage(prompt);
            if (!args.maxPrice && extractedMax) args.maxPrice = extractedMax;
            if (!args.sortBy && (this.isCheapestIntent(prompt) || this.prefersLowPrice(prompt))) {
              args.sortBy = 'price_asc';
            }
            callProducts = await this.executeSearchProducts(args);
          }

          const productsPayload = callProducts.map((p) => ({
            id: p.id,
            name: p.name,
            price: this.normalizeNumber(p.price),
            formattedPrice: `${new Intl.NumberFormat('vi-VN').format(this.normalizeNumber(p.price))} VNĐ`,
            category: p.category?.name || 'Chung',
            brand: p.brandEntity?.name || 'Khác',
            description: (p.description || '').replace(/\s+/g, ' ').slice(0, 100),
          }));

          const secondTurnBody: any = {
            contents: [
              { role: 'user', parts: [{ text: prompt }] },
              { role: 'model', parts },
              {
                role: 'user',
                parts: [
                  {
                    functionResponse: {
                      name: fnCall.name,
                      response: {
                        products: productsPayload,
                        totalFound: callProducts.length,
                      },
                    },
                  },
                ],
              },
            ],
            tools,
            generationConfig: {
              temperature: Math.min(Math.max(temperature, 0), 1),
              maxOutputTokens,
            },
          };
          if (systemInstruction) {
            secondTurnBody.systemInstruction = {
              parts: [{ text: systemInstruction }],
            };
          }

          try {
            const secondResponse = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(secondTurnBody),
              signal: AbortSignal.timeout(6000),
            });

            if (secondResponse.ok) {
              const secondData: any = await secondResponse.json();
              const secondCandidate = secondData?.candidates?.[0];
              const secondParts = secondCandidate?.content?.parts;
              if (Array.isArray(secondParts)) {
                const finalContent = secondParts
                  .map((p: any) => (typeof p?.text === 'string' ? p.text : ''))
                  .join('\n')
                  .trim();
                if (finalContent) {
                  return { text: finalContent, products: callProducts };
                }
              }
            }
          } catch (err: any) {
            this.logger.warn(`Gemini second turn error at ${model}: ${err?.message || err}`);
          }

          if (callProducts.length > 0) {
            return {
              text:
                `Dạ shop gửi anh/chị danh sách ${callProducts.length} sản phẩm phù hợp:\n\n` +
                callProducts
                  .map(
                    (p, i) =>
                      `${i + 1}. ${p.name}: ${new Intl.NumberFormat('vi-VN').format(this.normalizeNumber(p.price))} VNĐ`,
                  )
                  .join('\n'),
              products: callProducts,
            };
          }
        }

        // Direct Text Response
        const directText = parts
          .map((part: any) => (typeof part?.text === 'string' ? part.text : ''))
          .join('\n')
          .trim();

        if (directText) return { text: directText };
      } catch (error: any) {
        this.logger.error(`Gemini request failed at ${model}: ${error?.message || error}`);
        this.lastGeminiIssue = 'other';
      }
    }

    return null;
  }

  private makePromptCacheKey(message: string, maxPrice?: number, productId?: string): string {
    return `${message.trim().toLowerCase()}|${maxPrice || 0}|${productId || ''}`;
  }

  private getCachedAiResponse(cacheKey: string): string | null {
    const item = this.aiResponseCache.get(cacheKey);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.aiResponseCache.delete(cacheKey);
      return null;
    }
    return item.text;
  }

  private setCachedAiResponse(cacheKey: string, text: string): void {
    if (!text || text.length < 25) return;
    this.aiResponseCache.set(cacheKey, {
      text,
      expiresAt: Date.now() + this.cacheTtlMs,
    });
  }

  private compactAiText(text: string): string {
    let clean = (text || '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*/g, '')
      .replace(/^#+\s+/gm, '')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n');

    // Loại bỏ từ nối dở dang ở cuối nếu có (ví dụ câu bị ngắt ở: "và", "hoặc", "là", "với", "nhưng")
    clean = clean.replace(/\s+(và|hoặc|với|là|nhưng|được|có|khi|trong|để)$/i, '').trim();

    return clean || 'Dạ shop xin chào anh/chị, shop sẵn sàng hỗ trợ tư vấn sản phẩm cho mình ạ!';
  }

  // ==========================================
  // 6. MAIN AI PIPELINE: ASK AI ABOUT PRODUCTS
  // ==========================================
  async askAiAboutProducts(userId: string, message: string, productId?: string) {
    const trimmedMessage = (message || '').trim();
    if (!trimmedMessage) {
      throw new BadRequestException('No message provided');
    }

    // Check user & Human-In-The-Loop status
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const isMuted = user?.isBotMuted === true;

    // Save User message
    const savedUserMessage = await this.chatMessageRepo.save(
      this.chatMessageRepo.create({
        userId,
        message: trimmedMessage,
        sender: 'user',
        isRead: false,
        isAi: true,
      }),
    );

    // If Admin has taken over (isBotMuted = true), bot responds with informative notice and forwards question to admin
    if (isMuted) {
      const takeoverNotice =
        'Dạ hiện tại cuộc trò chuyện của anh/chị đang được chuyên viên hỗ trợ của shop tiếp quản trực tiếp. Em đã chuyển câu hỏi của mình sang cho nhân viên, anh/chị vui lòng chuyển sang tab "Chat với Shop" hoặc chờ nhân viên phản hồi trong ít phút nhé ạ!';

      const savedAiMessage = await this.chatMessageRepo.save(
        this.chatMessageRepo.create({
          userId,
          message: takeoverNotice,
          sender: 'admin',
          isRead: false,
          isAi: true,
        }),
      );

      // Chuyển tiếp câu hỏi của khách sang đoạn chat với Admin
      await this.chatMessageRepo.save(
        this.chatMessageRepo.create({
          userId,
          message: `[Tin nhắn từ khách khi tiếp quản]: ${trimmedMessage}`,
          sender: 'user',
          isRead: false,
          isAi: false,
        }),
      );

      return {
        message: 'Nhân viên đang tiếp quản hỗ trợ trực tiếp.',
        data: {
          userMessage: savedUserMessage,
          aiMessage: savedAiMessage,
          matchedProducts: [],
          isHumanTakeover: true,
        },
      };
    }

    // Load AI Config
    const aiConfig = await this.getAiConfig();
    if (aiConfig.isEnabled === false) {
      const fallbackNotice = 'Dạ hiện tại tính năng trợ lý ảo đang tạm bảo trì. Quý khách vui lòng nhắn tin trực tiếp với nhân viên hỗ trợ của shop ạ!';
      const savedAiMessage = await this.chatMessageRepo.save(
        this.chatMessageRepo.create({
          userId,
          message: fallbackNotice,
          sender: 'admin',
          isRead: false,
          isAi: true,
        }),
      );
      return {
        message: 'Trợ lý AI đang tắt',
        data: {
          userMessage: savedUserMessage,
          aiMessage: savedAiMessage,
          matchedProducts: [],
        },
      };
    }

    // Check emergency HITL keywords
    const isEmergency = this.checkHitlKeywords(trimmedMessage, aiConfig.emergencyKeywords);
    if (isEmergency && user) {
      // Auto mute bot and trigger takeover
      user.isBotMuted = true;
      await this.userRepo.save(user);

      const emergencyNotice =
        'Dạ em đã ghi nhận yêu cầu của anh/chị và đã chuyển cuộc trò chuyện sang cho chuyên viên hỗ trợ của shop. Em đang tự động chuyển anh/chị sang tab "Chat với Shop" để nhân viên hỗ trợ trực tiếp nhé ạ! ✨';

      const savedAiMessage = await this.chatMessageRepo.save(
        this.chatMessageRepo.create({
          userId,
          message: emergencyNotice,
          sender: 'admin',
          isRead: false,
          isAi: true,
        }),
      );

      // Tự động chuyển tiếp tin nhắn của khách sang đoạn chat với Admin
      await this.chatMessageRepo.save(
        this.chatMessageRepo.create({
          userId,
          message: `[Yêu cầu kết nối từ AI Chat]: ${trimmedMessage}`,
          sender: 'user',
          isRead: false,
          isAi: false,
        }),
      );

      return {
        message: 'Đã kích hoạt chuyển tiếp người thật (HITL)',
        data: {
          userMessage: savedUserMessage,
          aiMessage: savedAiMessage,
          matchedProducts: [],
          isEmergencyHitl: true,
          isHumanTakeover: true,
          targetTab: 'admin',
        },
      };
    }

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
          isAi: true,
        }),
      );

      return {
        message: 'AI đã phản hồi (cache)',
        data: {
          userMessage: savedUserMessage,
          aiMessage: savedAiMessage,
          matchedProducts: [],
        },
      };
    }

    // Retrieve relevant products using multi-factor criteria extractor
    const criteria = this.extractQueryCriteria(trimmedMessage, productId);
    let products = await this.executeSearchProducts(criteria);
    const productContext = this.buildProductContext(products);

    // Retrieve Knowledge Base (FAQ)
    const relevantFaqs = await this.findRelevantFaqs(trimmedMessage, 3);
    const faqContext =
      relevantFaqs.length > 0
        ? relevantFaqs
            .map((f, idx) => `${idx + 1}. [Chủ đề: ${f.category}] Hỏi: "${f.question}" -> Đáp: "${f.answer}"`)
            .join('\n')
        : 'Không có FAQ đặc thù phù hợp.';

    // Retrieve Conversation Memory
    const memoryContext = await this.getRecentConversationMemory(userId, aiConfig.maxHistoryTurns || 8);

    // Construct System Instruction & User Prompt
    const systemInstruction = [
      aiConfig.systemInstruction || 'Bạn là trợ lý AI chuyên nghiệp, chu đáo của cửa hàng thương mại điện tử.',
      '',
      'QUY TẮC PHỤC VỤ KHÁCH HÀNG & PHONG CÁCH BÁN HÀNG:',
      aiConfig.businessRules || '- Luôn xưng hô Dạ/Em thân thiện, gọi khách là anh/chị.',
      ...this.conciseRules.map((rule) => `- ${rule}`),
      '- Tuyệt đối KHÔNG dùng các ký tự markdown như dấu sao đôi (**) hoặc dấu thăng (#) trong câu trả lời. Giữ văn bản thuần túy, sạch đẹp và dễ đọc.',
      '- Chỉ đưa ra câu trả lời trực tiếp cho khách hàng. Không xuất phần phân tích, nháp hay ghi chú hệ thống.',
    ].join('\n');

    const promptParts = [
      '### [CƠ SỞ TRI THỨC FAQ CHUẨN XÁC CỦA SHOP]',
      faqContext,
      '',
      '### [DỮ LIỆU SẢN PHẨM TRONG HỆ THỐNG]',
      productContext,
      '',
      memoryContext ? `### [LỊCH SỬ TRÒ CHUYỆN GẦN ĐÂY]\n${memoryContext}\n` : '',
      `### [CÂU HỎI HIỆN TẠI CỦA KHÁCH HÀNG]\n${trimmedMessage}`,
      maxPrice && maxPrice > 0
        ? `(Ngân sách khách hàng đề cập: ${new Intl.NumberFormat('vi-VN').format(maxPrice)} VND)`
        : '',
      '',
      'LƯU Ý: Các sản phẩm phù hợp đã được nạp sẵn ở mục [DỮ LIỆU SẢN PHẨM TRONG HỆ THỐNG]. Hãy ưu tiên sử dụng danh sách này để tư vấn trực tiếp cho khách một cách nhanh chóng, súc tích và chính xác. Chỉ gọi tool search_products khi khách hàng yêu cầu tìm các sản phẩm khác chưa có ở trên.',
    ];

    const finalPrompt = promptParts.filter(Boolean).join('\n');

    this.lastGeminiIssue = 'none';
    const geminiResult = await this.callGemini(
      finalPrompt,
      systemInstruction,
      aiConfig.temperature || 0.3,
    );

    let aiTextRaw: string;
    if (geminiResult && geminiResult.text) {
      aiTextRaw = geminiResult.text;
      if (geminiResult.products && geminiResult.products.length > 0) {
        products = geminiResult.products;
      }
    } else {
      aiTextRaw = this.generateSmartFallbackResponse(
        trimmedMessage,
        relevantFaqs,
        products,
        criteria.maxPrice || maxPrice || null,
        aiConfig,
      );
    }

    const aiText = this.compactAiText(aiTextRaw);
    this.setCachedAiResponse(cacheKey, aiText);

    // If AI explicitly states that the shop does not sell/have the product or out of stock:
    const isNegativeReply =
      /(khong co|không có|khong kinh doanh|không kinh doanh|chua kinh doanh|chưa kinh doanh|khong ban|không bán|tam het hang|tạm hết hàng|khong tim thay|không tìm thấy)/i.test(
        aiText,
      );

    let finalMatchedProducts = products;
    if (isNegativeReply) {
      finalMatchedProducts = [];
    } else {
      if (criteria.category) {
        const catNorm = this.removeVietnameseTones(criteria.category);
        finalMatchedProducts = finalMatchedProducts.filter(
          (p) => p.category && this.removeVietnameseTones(p.category.name).includes(catNorm),
        );
      }
      if (criteria.maxPrice && criteria.maxPrice > 0) {
        finalMatchedProducts = finalMatchedProducts.filter(
          (p) => this.normalizeNumber(p.price) <= criteria.maxPrice!,
        );
      }
    }

    const savedAiMessage = await this.chatMessageRepo.save(
      this.chatMessageRepo.create({
        userId,
        message: aiText,
        sender: 'admin',
        isRead: false,
        isAi: true,
      }),
    );

    return {
      message: 'AI đã phản hồi thành công',
      data: {
        userMessage: savedUserMessage,
        aiMessage: savedAiMessage,
        matchedProducts: finalMatchedProducts.map((p) => ({
          id: p.id,
          name: p.name,
          price: this.normalizeNumber(p.price),
          image: p.images?.find((img) => img.isMain)?.imageUrl || p.image || null,
        })),
        faqsMatchedCount: relevantFaqs.length,
      },
    };
  }

  private generateSmartFallbackResponse(
    userMessage: string,
    relevantFaqs: Faq[],
    products: Product[],
    maxPrice: number | null,
    aiConfig: AiConfig,
  ): string {
    const text = (userMessage || '').trim().toLowerCase();
    const unaccentText = this.removeVietnameseTones(text);

    // 0. Handover Intent (Nếu là yêu cầu gặp/chat với nhân viên)
    if (this.checkHitlKeywords(userMessage)) {
      return `Dạ em đã ghi nhận yêu cầu của anh/chị và đã chuyển cuộc trò chuyện sang cho chuyên viên hỗ trợ của shop. Anh/chị vui lòng chuyển sang tab "Chat với Shop" để được nhân viên hỗ trợ trực tiếp nhé ạ! ✨`;
    }

    // 1. Greetings (Ưu tiên nếu là câu chào hỏi ngắn)
    const isPureGreeting = /^(chao|xin chao|hello|hi|hey|alo|shop oi|ad oi|admin oi|chao shop|chao ad|chao ban|hi shop|hello shop)(!|\?|\s+nhe|\s+nha|\s+a|\s+oi|\s+minh|\s+ban)*$/i.test(
      unaccentText,
    );
    if (isPureGreeting) {
      return `Dạ shop em chào anh/chị! ✨ Em là trợ lý AI của shop. Em có thể hỗ trợ anh/chị ngay:\n\n1. 🔍 Tìm kiếm sản phẩm, tư vấn size & màu sắc\n2. 🚚 Tra cứu phí giao hàng & thời gian nhận hàng\n3. 🔄 Chính sách đổi trả & bảo hành sản phẩm\n4. ⚡ Săn mã giảm giá Flash Sale & Voucher\n\nAnh/chị đang quan tâm đến sản phẩm hay cần giải đáp thắc mắc nào ạ?`;
    }

    // 2. Budget Search Intent (Tìm theo tầm giá cụ thể / rẻ nhất / cao cấp)
    if (maxPrice || this.isCheapestIntent(userMessage) || this.isHighestPriceIntent(userMessage)) {
      const catName = this.extractCategoryFromMessage(userMessage);
      if (products && products.length > 0) {
        const budgetLabel = maxPrice
          ? `dưới ${new Intl.NumberFormat('vi-VN').format(maxPrice)}đ`
          : this.isCheapestIntent(userMessage)
            ? 'giá tốt nhất'
            : 'phân khúc cao cấp';
        const prefix = catName ? `sản phẩm ${catName}` : 'sản phẩm';
        let response = `Dạ shop có các ${prefix} ${budgetLabel} hiện có tại cửa hàng:\n\n`;
        products.forEach((p, idx) => {
          const price = new Intl.NumberFormat('vi-VN').format(this.normalizeNumber(p.price));
          response += `${idx + 1}. ${p.name}: ${price} VNĐ\n`;
        });
        return response.trim();
      } else if (catName) {
        return `Dạ hiện tại shop chưa có sản phẩm ${catName} phù hợp với mức giá yêu cầu. Anh/chị có thể tham khảo các dòng ${catName} khác tại shop hoặc nhắn tin với nhân viên hỗ trợ nhé ạ!`;
      }
    }

    // 3. FAQ Intent (Ưu tiên cao nhất khi tìm thấy câu trả lời chính xác trong FAQ Knowledge Base)
    if (relevantFaqs && relevantFaqs.length > 0) {
      const topFaq = relevantFaqs[0];
      let response = `Dạ shop xin giải đáp thắc mắc của anh/chị về "${topFaq.question}":\n\n👉 ${topFaq.answer}`;

      // Nếu có thêm FAQ phụ liên quan
      if (relevantFaqs.length > 1) {
        const extraFaqs = relevantFaqs.slice(1, 3);
        response +=
          `\n\n📌 Thông tin hữu ích khác:\n` +
          extraFaqs.map((f) => `• ${f.question}: ${f.answer}`).join('\n');
      }

      response += `\n\nNếu anh/chị cần hỗ trợ thêm thông tin gì khác, cứ nhắn cho em nhé ạ! 💕`;
      return response;
    }

    // 4. Flash Sale & Giảm giá Intent
    if (
      this.isFlashSaleIntent(userMessage) ||
      /\b(flash sale|sale|khuyen mai|giam gia|voucher|ma giam gia|coupon|deal)\b/i.test(unaccentText)
    ) {
      if (products && products.length > 0) {
        let response = `🔥 Dạ các deal Flash Sale & Giảm giá cực hot đang diễn ra tại shop:\n\n`;
        products.forEach((p, idx) => {
          const price = new Intl.NumberFormat('vi-VN').format(this.normalizeNumber(p.price));
          response += `${idx + 1}. ${p.name}\n   💰 Giá ưu đãi: ${price}đ\n`;
        });
        response += `\n⚡ Số lượng deal có hạn, anh/chị nhanh tay chọn ngay mẫu ưng ý nhé ạ!`;
        return response;
      }
      return `🔥 Dạ chương trình Flash Sale của shop đang diễn ra với nhiều ưu đãi giảm sâu đến 50%. Anh/chị có thể ghé mục Flash Sale tại trang chủ để nhận voucher và mua sắm với giá tốt nhất nhé ạ!`;
    }

    // 5. Best-Selling Intent
    if (
      this.isBestSellingIntent(userMessage) ||
      /\b(ban chay|hot nhat|yeu thich|top ban chay|bestseller)\b/i.test(unaccentText)
    ) {
      if (products && products.length > 0) {
        const catName = this.extractCategoryFromMessage(userMessage);
        const prefix = catName ? `sản phẩm ${catName} ` : '';
        let response = `🌟 Top các ${prefix}bán chạy nhất được khách hàng yêu thích tại shop:\n\n`;
        products.forEach((p, idx) => {
          const price = new Intl.NumberFormat('vi-VN').format(this.normalizeNumber(p.price));
          response += `${idx + 1}. ${p.name}\n   💰 Giá: ${price}đ\n`;
        });
        response += `\nAnh/chị ưng mẫu nào có thể nhắn em để em tư vấn size và màu chi tiết nhé ạ! ✨`;
        return response;
      }
    }

    // 6. General Products Listing
    if (products && products.length > 0) {
      const catName = this.extractCategoryFromMessage(userMessage);
      const prefix = catName ? `sản phẩm ${catName}` : 'sản phẩm';
      let response = `🛍️ Dạ shop có những ${prefix} phù hợp với yêu cầu của anh/chị đây ạ:\n\n`;
      products.forEach((p, idx) => {
        const price = new Intl.NumberFormat('vi-VN').format(this.normalizeNumber(p.price));
        response += `${idx + 1}. ${p.name}: ${price} VNĐ\n`;
      });
      response += `\nAnh/chị cần em tư vấn chi tiết về tính năng hoặc chương trình ưu đãi của mẫu nào cứ nhắn em nhé!`;
      return response;
    }

    return `Dạ em đã nhận được câu hỏi của anh/chị. Anh/chị có thể cho em biết cụ thể hơn về tên sản phẩm, mức giá mong muốn hoặc thắc mắc về phí ship, đổi trả để em giải đáp nhanh nhất nhé ạ!`;
  }

  // ==========================================
  // 7. USER & ADMIN CHAT MESSAGING
  // ==========================================
  // User gửi tin nhắn thông thường
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
      .addSelect('user.isBotMuted', 'isBotMuted')
      .addSelect('MAX(msg.createdAt)', 'lastMessageAt')
      .addSelect(
        "COUNT(CASE WHEN msg.sender = 'user' AND msg.isRead = false THEN 1 END)",
        'unreadCount',
      )
      .groupBy('msg.userId')
      .addGroupBy('user.name')
      .addGroupBy('user.email')
      .addGroupBy('user.isBotMuted')
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