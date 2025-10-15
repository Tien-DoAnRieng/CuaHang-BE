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
exports.ProductVariant = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../shared/schemas/base.entity");
const product_entity_1 = require("./product.entity");
const color_entity_1 = require("./color.entity");
const size_entity_1 = require("./size.entity");
let ProductVariant = class ProductVariant extends base_entity_1.BaseEntity {
    productId;
    colorId;
    sizeId;
    stockQuantity;
    priceOverride;
    product;
    color;
    size;
};
exports.ProductVariant = ProductVariant;
__decorate([
    (0, typeorm_1.Column)({ name: 'product_id' }),
    __metadata("design:type", String)
], ProductVariant.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'color_id' }),
    __metadata("design:type", String)
], ProductVariant.prototype, "colorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'size_id' }),
    __metadata("design:type", String)
], ProductVariant.prototype, "sizeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'stock_quantity' }),
    __metadata("design:type", Number)
], ProductVariant.prototype, "stockQuantity", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'price_override',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Number)
], ProductVariant.prototype, "priceOverride", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_entity_1.Product)
], ProductVariant.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => color_entity_1.Color),
    (0, typeorm_1.JoinColumn)({ name: 'color_id' }),
    __metadata("design:type", color_entity_1.Color)
], ProductVariant.prototype, "color", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => size_entity_1.Size),
    (0, typeorm_1.JoinColumn)({ name: 'size_id' }),
    __metadata("design:type", size_entity_1.Size)
], ProductVariant.prototype, "size", void 0);
exports.ProductVariant = ProductVariant = __decorate([
    (0, typeorm_1.Entity)('product_variants')
], ProductVariant);
//# sourceMappingURL=product-variant.entity.js.map