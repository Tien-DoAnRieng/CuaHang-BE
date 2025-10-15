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
exports.ProductVariantService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_variant_entity_1 = require("../../shared/schemas/entities/product-variant.entity");
let ProductVariantService = class ProductVariantService {
    variantRepository;
    constructor(variantRepository) {
        this.variantRepository = variantRepository;
    }
    create(data) {
        const variant = this.variantRepository.create(data);
        return this.variantRepository.save(variant);
    }
    findAll(query) {
        return this.variantRepository.find({ where: query });
    }
    findOne(id) {
        return this.variantRepository.findOne({ where: { id } });
    }
    async update(id, data) {
        await this.variantRepository.update(id, data);
        return this.variantRepository.findOne({ where: { id } });
    }
    remove(id) {
        return this.variantRepository.delete(id);
    }
};
exports.ProductVariantService = ProductVariantService;
exports.ProductVariantService = ProductVariantService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_variant_entity_1.ProductVariant)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ProductVariantService);
//# sourceMappingURL=product-variant.service.js.map