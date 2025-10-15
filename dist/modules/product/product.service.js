"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("../../shared/schemas/entities/product.entity");
const category_entity_1 = require("../../shared/schemas/entities/category.entity");
let ProductService = class ProductService {
    productRepository;
    categoryRepository;
    constructor(productRepository, categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }
    async create(data) {
        const product = this.productRepository.create(data);
        return this.productRepository.save(product);
    }
    async findAll(query) {
        const { search, brand, category, status, minPrice, maxPrice, page = 1, limit = 10 } = query;
        const where = {};
        if (search) {
            where.name = (0, typeorm_2.ILike)(`%${search}%`);
        }
        if (brand)
            where.brand = brand;
        if (category)
            where.category = { id: category };
        if (status)
            where.status = status;
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice)
                where.price['$gte'] = minPrice;
            if (maxPrice)
                where.price['$lte'] = maxPrice;
        }
        const [data, total] = await this.productRepository.findAndCount({
            where,
            relations: ['category'],
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, total, page: Number(page), limit: Number(limit) };
    }
    async findOne(id) {
        return this.productRepository.findOne({
            where: { id },
            relations: ['category'],
        });
    }
    async findOneOrNull(id) {
        return this.productRepository.findOne({
            where: { id },
            relations: ['category'],
        });
    }
    async update(id, data) {
        await this.productRepository.update(id, data);
        return this.findOne(id);
    }
    async remove(id) {
        await this.productRepository.delete(id);
    }
};
exports.ProductService = ProductService;
exports.ProductService = ProductService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ProductService);
//# sourceMappingURL=product.service.js.map