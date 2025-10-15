"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductVariantModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const product_variant_entity_1 = require("../../shared/schemas/entities/product-variant.entity");
const product_variant_controller_1 = require("./product-variant.controller");
const product_variant_service_1 = require("./product-variant.service");
let ProductVariantModule = class ProductVariantModule {
};
exports.ProductVariantModule = ProductVariantModule;
exports.ProductVariantModule = ProductVariantModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([product_variant_entity_1.ProductVariant])],
        controllers: [product_variant_controller_1.ProductVariantController],
        providers: [product_variant_service_1.ProductVariantService],
        exports: [typeorm_1.TypeOrmModule, product_variant_service_1.ProductVariantService],
    })
], ProductVariantModule);
//# sourceMappingURL=product-variant.module.js.map