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
exports.CartItem = void 0;
const typeorm_1 = require("typeorm");
const cart_entity_1 = require("../entities/cart.entity");
const product_variant_entity_1 = require("../entities/product-variant.entity");
let CartItem = class CartItem {
    cartId;
    variantId;
    quantity;
    cart;
    variant;
};
exports.CartItem = CartItem;
__decorate([
    (0, typeorm_1.Column)({ name: 'cart_id', primary: true }),
    __metadata("design:type", String)
], CartItem.prototype, "cartId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'variant_id', primary: true }),
    __metadata("design:type", String)
], CartItem.prototype, "variantId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], CartItem.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cart_entity_1.Cart),
    (0, typeorm_1.JoinColumn)({ name: 'cart_id' }),
    __metadata("design:type", cart_entity_1.Cart)
], CartItem.prototype, "cart", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_variant_entity_1.ProductVariant),
    (0, typeorm_1.JoinColumn)({ name: 'variant_id' }),
    __metadata("design:type", product_variant_entity_1.ProductVariant)
], CartItem.prototype, "variant", void 0);
exports.CartItem = CartItem = __decorate([
    (0, typeorm_1.Entity)('cart_items')
], CartItem);
//# sourceMappingURL=cart-item.entity.js.map