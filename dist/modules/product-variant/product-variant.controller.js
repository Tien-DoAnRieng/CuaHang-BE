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
exports.ProductVariantController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_variant_entity_1 = require("../../shared/schemas/entities/product-variant.entity");
const create_product_variant_dto_1 = require("./dto/create-product-variant.dto");
const update_product_variant_dto_1 = require("./dto/update-product-variant.dto");
let ProductVariantController = class ProductVariantController {
    variantRepository;
    constructor(variantRepository) {
        this.variantRepository = variantRepository;
    }
    async create(dto) {
        const variant = this.variantRepository.create(dto);
        return this.variantRepository.save(variant);
    }
    async findAll(query) {
        return this.variantRepository.find({ where: query });
    }
    async findOne(id) {
        return this.variantRepository.findOne({ where: { id } });
    }
    async update(id, dto) {
        await this.variantRepository.update(id, dto);
        return this.variantRepository.findOne({ where: { id } });
    }
    async remove(id) {
        return this.variantRepository.delete(id);
    }
};
exports.ProductVariantController = ProductVariantController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_product_variant_dto_1.CreateProductVariantDto]),
    __metadata("design:returntype", Promise)
], ProductVariantController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProductVariantController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductVariantController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_product_variant_dto_1.UpdateProductVariantDto]),
    __metadata("design:returntype", Promise)
], ProductVariantController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductVariantController.prototype, "remove", null);
exports.ProductVariantController = ProductVariantController = __decorate([
    (0, common_1.Controller)('product-variants'),
    __param(0, (0, typeorm_1.InjectRepository)(product_variant_entity_1.ProductVariant)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ProductVariantController);
//# sourceMappingURL=product-variant.controller.js.map