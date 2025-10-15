"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProductVariantDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_product_variant_dto_1 = require("./create-product-variant.dto");
class UpdateProductVariantDto extends (0, mapped_types_1.PartialType)(create_product_variant_dto_1.CreateProductVariantDto) {
}
exports.UpdateProductVariantDto = UpdateProductVariantDto;
//# sourceMappingURL=update-product-variant.dto.js.map