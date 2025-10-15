"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProductImageDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_product_image_dto_1 = require("./create-product-image.dto");
class UpdateProductImageDto extends (0, mapped_types_1.PartialType)(create_product_image_dto_1.CreateProductImageDto) {
}
exports.UpdateProductImageDto = UpdateProductImageDto;
//# sourceMappingURL=update-product-image.dto.js.map