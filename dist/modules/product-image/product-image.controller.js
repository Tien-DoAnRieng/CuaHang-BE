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
exports.ProductImageController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_image_entity_1 = require("../../shared/schemas/entities/product-image.entity");
const create_product_image_dto_1 = require("./dto/create-product-image.dto");
const update_product_image_dto_1 = require("./dto/update-product-image.dto");
let ProductImageController = class ProductImageController {
    imageRepository;
    constructor(imageRepository) {
        this.imageRepository = imageRepository;
    }
    async create(dto) {
        const image = this.imageRepository.create(dto);
        return this.imageRepository.save(image);
    }
    async findAll(query) {
        return this.imageRepository.find({ where: query });
    }
    async findOne(id) {
        return this.imageRepository.findOne({ where: { id } });
    }
    async update(id, dto) {
        await this.imageRepository.update(id, dto);
        return this.imageRepository.findOne({ where: { id } });
    }
    async remove(id) {
        return this.imageRepository.delete(id);
    }
};
exports.ProductImageController = ProductImageController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_product_image_dto_1.CreateProductImageDto]),
    __metadata("design:returntype", Promise)
], ProductImageController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProductImageController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductImageController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_product_image_dto_1.UpdateProductImageDto]),
    __metadata("design:returntype", Promise)
], ProductImageController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductImageController.prototype, "remove", null);
exports.ProductImageController = ProductImageController = __decorate([
    (0, common_1.Controller)('product-images'),
    __param(0, (0, typeorm_1.InjectRepository)(product_image_entity_1.ProductImage)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ProductImageController);
//# sourceMappingURL=product-image.controller.js.map