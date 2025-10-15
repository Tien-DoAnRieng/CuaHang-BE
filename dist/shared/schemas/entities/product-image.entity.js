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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductImage = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../shared/schemas/base.entity");
const product_entity_1 = require("./product.entity");
const product_variant_entity_1 = require("./product-variant.entity");
let ProductImage = class ProductImage extends base_entity_1.BaseEntity {
    productId;
    variantId;
    imageUrl;
    isMain;
    product;
    variant;
};
exports.ProductImage = ProductImage;
__decorate([
    (0, typeorm_1.Column)({ name: 'product_id' }),
    __metadata("design:type", String)
], ProductImage.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'variant_id', nullable: true }),
    __metadata("design:type", String)
], ProductImage.prototype, "variantId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'image_url', type: 'text' }),
    __metadata("design:type", String)
], ProductImage.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_main', default: false }),
    __metadata("design:type", Boolean)
], ProductImage.prototype, "isMain", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_entity_1.Product)
], ProductImage.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_variant_entity_1.ProductVariant),
    (0, typeorm_1.JoinColumn)({ name: 'variant_id' }),
    __metadata("design:type", product_variant_entity_1.ProductVariant)
], ProductImage.prototype, "variant", void 0);
exports.ProductImage = ProductImage = __decorate([
    (0, typeorm_1.Entity)('product_images')
], ProductImage);
//# sourceMappingURL=product-image.entity.js.map