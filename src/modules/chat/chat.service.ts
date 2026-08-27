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

  private checkHitlKeywords(message: string, keywordsStr?: string): boolean {
    if (!message) return false;
    const rawKeywords =
      keywordsStr ||
      'lừa đảo, khiếu nại, gặp nhân viên, gặp admin, gặp người thật, hỗ trợ người thật, thái độ, bồi thường, trả hàng gấp, đổi trả gấp, hủy đơn khẩn cấp, hoàn tiền gấp, kiện, cướp, công an, tư vấn viên, liên hệ admin, gặp quản lý, nhân viên hỗ trợ, nói chuyện với người, đền tiền, giao thiếu hàng, hàng hỏng, vỡ hàng';
    const keywords = rawKeywords
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);
    const lowerMessage = message.toLowerCase();
    const unaccentMessage = this.removeVietnameseTones(lowerMessage);

    return keywords.some((kw) => {
      const lowerKw = kw.toLowerCase();
      const unaccentKw = this.removeVietnameseTones(lowerKw);
      return lowerMessage.includes(lowerKw) || unaccentMessage.includes(unaccentKw);
    });
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
    if (productId) {
      const direct = await this.productRepo.findOne({
        where: { id: productId, status: 'ACTIVE' },
        relations: ['category', 'brandEntity', 'images', 'variants'],
      });
      if (direct) return [direct];
    }

    const cleaned = message.replace(/[^a-zA-Z0-9\sà-ỹÀ-Ỹ]/g, ' ').trim();
    const tokens = cleaned.split(/\s+/).filter((t) => t.length > 1);

    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brandEntity', 'brandEntity')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.variants', 'variants')
      .where('product.status = :status', { status: 'ACTIVE' });

    if (maxPrice && maxPrice > 0) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    if (tokens.length > 0) {
      qb.andWhere(
        tokens
          .slice(0, 5)
          .map(
            (_, idx) =>
              `(product.name LIKE :t${idx} OR product.description LIKE :t${idx} OR category.name LIKE :t${idx} OR brandEntity.name LIKE :t${idx})`,
          )
          .join(' OR '),
        tokens.slice(0, 5).reduce((acc, t, idx) => ({ ...acc, [`t${idx}`]: `%${t}%` }), {}),
      );
    }

    qb.orderBy(maxPrice && maxPrice > 0 ? 'product.price' : 'product.createdAt', maxPrice ? 'ASC' : 'DESC');
    const results = await qb.take(5).getMany();
    if (results.length > 0) return results;

    return this.findFallbackProductsByBudget(maxPrice, 5);
  }

  private extractBudgetFromMessage(message: string): number | null {
    const text = (message || '').toLowerCase();
    const millionMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(trieu|triệu|tr|m)\b/i);
    if (millionMatch) {
      const val = parseFloat(millionMatch[1].replace(',', '.'));
      if (Number.isFinite(val) && val > 0) return Math.round(val * 1_000_000);
    }

    const thousandMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(k|nghin|nghìn|ngan|ngàn)\b/i);
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
  // 5. CALL GEMINI API
  // ==========================================
  private async callGemini(
    prompt: string,
    systemInstruction?: string,
    temperature: number = 0.3,
    maxOutputTokens: number = 800,
  ): Promise<string | null> {
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

    const configuredModel = (this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.0-flash').trim();
    const forceFallback = String(this.configService.get<string>('GEMINI_FORCE_FALLBACK') || '')
      .toLowerCase()
      .trim();
    if (forceFallback === '1' || forceFallback === 'true' || forceFallback === 'yes') {
      this.lastGeminiIssue = 'other';
      return null;
    }

    // Ưu tiên chính xác model 2.0 Flash
    const modelCandidates = [configuredModel, 'gemini-2.0-flash', 'gemini-2.0-flash-lite'].filter(
      (m, idx, arr) => m && arr.indexOf(m) === idx,
    );

    for (const model of modelCandidates) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        
        const requestBody: any = {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
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
          signal: AbortSignal.timeout(15000),
        });

        if (response.status === 404) continue;
        
        if (response.status === 429) {
          // Tự động giãn cách 5 - 10 giây (8 giây) khi bị quá tải Rate Limit
          const cooldownDurationMs = 8000;
          this.geminiCooldownUntil = Date.now() + cooldownDurationMs;
          this.lastGeminiIssue = 'quota';
          this.logger.warn(`Gemini 429 (Rate Limit). Tu dong gian cach ${cooldownDurationMs / 1000}s truoc khi thu lai.`);
          // Dừng ngay vòng lặp để không spam thêm request
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

        let text = parts
          .map((part: any) => (typeof part?.text === 'string' ? part.text : ''))
          .join('\n')
          .trim();

        if (text) return text;
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
        'Dạ em đã ghi nhận phản ánh của anh/chị và đã chuyển yêu cầu đến chuyên viên hỗ trợ của shop. Nhân viên sẽ phản hồi trực tiếp với anh/chị trong ít phút nữa ạ!';

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
          message: `[Yêu cầu chuyển tiếp từ AI Chat]: ${trimmedMessage}`,
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

    // Retrieve relevant products
    let products = cheapestIntent
      ? await this.findFallbackProductsByBudget(maxPrice || undefined)
      : highestIntent
        ? await this.findHighestPriceProducts(10)
        : bestSellingIntent
          ? await this.findBestSellingProducts(10)
          : flashSaleIntent
            ? await this.findActiveFlashSaleProducts(5)
            : await this.findRelevantProducts(trimmedMessage, productId, maxPrice || undefined);

    if (products.length === 0) {
      products = await this.findFallbackProductsByBudget(maxPrice || undefined);
    }
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
    ];

    const finalPrompt = promptParts.filter(Boolean).join('\n');

    this.lastGeminiIssue = 'none';
    let aiTextRaw = await this.callGemini(
      finalPrompt,
      systemInstruction,
      aiConfig.temperature || 0.3,
    );

    if (!aiTextRaw) {
      aiTextRaw = this.generateSmartFallbackResponse(
        trimmedMessage,
        relevantFaqs,
        products,
        maxPrice,
        aiConfig,
      );
    }

    const aiText = this.compactAiText(aiTextRaw);
    this.setCachedAiResponse(cacheKey, aiText);

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
        matchedProducts: products.slice(0, 5).map((p) => ({
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

    // 1. Greetings (Ưu tiên nếu là câu chào hỏi ngắn)
    const isPureGreeting = /^(chao|xin chao|hello|hi|hey|alo|shop oi|ad oi|admin oi|chao shop|chao ad|chao ban|hi shop|hello shop)(!|\?|\s+nhe|\s+nha|\s+a|\s+oi|\s+minh|\s+ban)*$/i.test(
      unaccentText,
    );
    if (isPureGreeting) {
      return `Dạ shop em chào anh/chị! ✨ Em là trợ lý AI của shop. Em có thể hỗ trợ anh/chị ngay:\n\n1. 🔍 Tìm kiếm sản phẩm, tư vấn size & màu sắc\n2. 🚚 Tra cứu phí giao hàng & thời gian nhận hàng\n3. 🔄 Chính sách đổi trả & bảo hành sản phẩm\n4. ⚡ Săn mã giảm giá Flash Sale & Voucher\n\nAnh/chị đang quan tâm đến sản phẩm hay cần giải đáp thắc mắc nào ạ?`;
    }

    // 2. Budget Search Intent (Tìm theo tầm giá cụ thể / rẻ nhất / cao cấp)
    if (maxPrice || this.isCheapestIntent(userMessage) || this.isHighestPriceIntent(userMessage)) {
      if (products && products.length > 0) {
        const budgetLabel = maxPrice
          ? `dưới ${new Intl.NumberFormat('vi-VN').format(maxPrice)}đ`
          : this.isCheapestIntent(userMessage)
            ? 'giá tốt nhất'
            : 'phân khúc cao cấp';
        let response = `Dạ shop có các sản phẩm ${budgetLabel} hiện có tại cửa hàng:\n\n`;
        products.slice(0, 5).forEach((p, idx) => {
          const price = new Intl.NumberFormat('vi-VN').format(this.normalizeNumber(p.price));
          response += `${idx + 1}. ${p.name}: ${price} VNĐ\n`;
        });
        return response.trim();
      }
    }

    // 3. FAQ Intent (Ưu tiên cao nhất khi tìm thấy câu trả lời chính xác trong FAQ Knowledge Base)
    if (relevantFaqs && relevantFaqs.length > 0) {
      const topFaq = relevantFaqs[0];
      let response = `Dạ shop xin giải đáp thắc mắc của anh/chị về "${topFaq.question}":\n\n👉 ${topFaq.answer}`;

      // Nếu có thêm FAQ phụ liên quan
      if (relevantFaqs.length > 1) {
        const extraFaqs = relevantFaqs.slice(1, 3);
        response += `\n\n📌 Thông tin hữu ích khác:\n` +
          extraFaqs.map((f) => `• ${f.question}: ${f.answer}`).join('\n');
      }

      response += `\n\nNếu anh/chị cần hỗ trợ thêm thông tin gì khác, cứ nhắn cho em nhé ạ! 💕`;
      return response;
    }

    // 3. Flash Sale & Giảm giá Intent
    if (this.isFlashSaleIntent(userMessage) || /\b(flash sale|sale|khuyen mai|giam gia|voucher|ma giam gia|coupon|deal)\b/i.test(unaccentText)) {
      if (products && products.length > 0) {
        let response = `🔥 Dạ các deal Flash Sale & Giảm giá cực hot đang diễn ra tại shop:\n\n`;
        products.slice(0, 4).forEach((p, idx) => {
          const price = new Intl.NumberFormat('vi-VN').format(this.normalizeNumber(p.price));
          response += `${idx + 1}. ${p.name}\n   💰 Giá ưu đãi: ${price}đ\n`;
        });
        response += `\n⚡ Số lượng deal có hạn, anh/chị nhanh tay chọn ngay mẫu ưng ý nhé ạ!`;
        return response;
      }
      return `🔥 Dạ chương trình Flash Sale của shop đang diễn ra với nhiều ưu đãi giảm sâu đến 50%. Anh/chị có thể ghé mục Flash Sale tại trang chủ để nhận voucher và mua sắm với giá tốt nhất nhé ạ!`;
    }

    // 4. Best-Selling Intent
    if (this.isBestSellingIntent(userMessage) || /\b(ban chay|hot nhat|yeu thich|top ban chay|bestseller)\b/i.test(unaccentText)) {
      if (products && products.length > 0) {
        let response = `🌟 Top các sản phẩm bán chạy nhất được khách hàng yêu thích tại shop:\n\n`;
        products.slice(0, 4).forEach((p, idx) => {
          const price = new Intl.NumberFormat('vi-VN').format(this.normalizeNumber(p.price));
          response += `${idx + 1}. ${p.name}\n   💰 Giá: ${price}đ\n`;
        });
        response += `\nAnh/chị ưng mẫu nào có thể nhắn em để em tư vấn size và màu chi tiết nhé ạ! ✨`;
        return response;
      }
    }

    // 5. Budget Search Intent (Tìm theo tầm giá / rẻ nhất / cao cấp)
    if (maxPrice || this.isCheapestIntent(userMessage) || this.isHighestPriceIntent(userMessage)) {
      if (products && products.length > 0) {
        const budgetLabel = maxPrice
          ? `tầm giá dưới ${new Intl.NumberFormat('vi-VN').format(maxPrice)}đ`
          : this.isCheapestIntent(userMessage)
            ? 'mức giá tốt nhất'
            : 'phân khúc cao cấp';
        let response = `🏷️ **Dạ shop có các sản phẩm ở ${budgetLabel} phù hợp cho mình đây ạ:**\n\n`;
        products.slice(0, 4).forEach((p, idx) => {
          const price = new Intl.NumberFormat('vi-VN').format(this.normalizeNumber(p.price));
          response += `${idx + 1}. **${p.name}**\n   💰 Giá: **${price}đ**\n`;
        });
        response += `\nAnh/chị cần em kiểm tra còn size cho mẫu nào không ạ?`;
        return response;
      }
    }

    // 6. Product Search Intent (Tìm theo tên / loại sản phẩm)
    const isProductQuery = /\b(ao|quan|vay|dam|giay|dep|tui|balo|khoac|so mi|thun|jeans|kaki|nam|nu|size|mau|chat lieu|mau ma|san pham|do nam|do nu)\b/i.test(
      unaccentText,
    );
    if (isProductQuery && products && products.length > 0) {
      let response = `🛍️ **Dạ shop có những mẫu sản phẩm phù hợp với yêu cầu của anh/chị đây ạ:**\n\n`;
      products.slice(0, 4).forEach((p, idx) => {
        const price = new Intl.NumberFormat('vi-VN').format(this.normalizeNumber(p.price));
        response += `${idx + 1}. **${p.name}**\n   💰 Giá: **${price}đ**\n`;
      });
      response += `\nAnh/chị cần em tư vấn chi tiết về size, màu sắc hoặc hình ảnh thực tế mẫu nào cứ nhắn em nhé!`;
      return response;
    }

    // 7. General Fallback with Product Suggestions
    if (products && products.length > 0) {
      let response = `Dạ shop em xin gợi ý một số sản phẩm nổi bật đang có sẵn tại shop:\n\n`;
      products.slice(0, 3).forEach((p, idx) => {
        const price = new Intl.NumberFormat('vi-VN').format(this.normalizeNumber(p.price));
        response += `${idx + 1}. **${p.name}** - ${price}đ\n`;
      });
      response += `\nAnh/chị có thể hỏi chi tiết hơn về size, màu sắc, phí giao hàng hoặc chính sách đổi trả nhé ạ!`;
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