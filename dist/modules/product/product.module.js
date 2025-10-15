"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const product_entity_1 = require("../../shared/schemas/entities/product.entity");
const category_entity_1 = require("../../shared/schemas/entities/category.entity");
const color_entity_1 = require("../../shared/schemas/entities/color.entity");
const size_entity_1 = require("../../shared/schemas/entities/size.entity");
const product_variant_entity_1 = require("../../shared/schemas/entities/product-variant.entity");
const product_image_entity_1 = require("../../shared/schemas/entities/product-image.entity");
const product_variant_module_1 = require("../product-variant/product-variant.module");
const product_image_module_1 = require("../product-image/product-image.module");
const product_controller_1 = require("./product.controller");
const product_service_1 = require("./product.service");
let ProductModule = class ProductModule {
};
exports.ProductModule = ProductModule;
exports.ProductModule = ProductModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                product_entity_1.Product,
                category_entity_1.Category,
                color_entity_1.Color,
                size_entity_1.Size,
                product_variant_entity_1.ProductVariant,
                product_image_entity_1.ProductImage,
            ]),
            product_variant_module_1.ProductVariantModule,
            product_image_module_1.ProductImageModule,
        ],
        controllers: [product_controller_1.ProductController],
        providers: [product_service_1.ProductService],
        exports: [typeorm_1.TypeOrmModule, product_variant_module_1.ProductVariantModule, product_image_module_1.ProductImageModule],
    })
], ProductModule);
//# sourceMappingURL=product.module.js.map