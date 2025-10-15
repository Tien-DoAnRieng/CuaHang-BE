import { BaseEntity } from '../../../shared/schemas/base.entity';
import { Product } from './product.entity';
import { Color } from './color.entity';
import { Size } from './size.entity';
export declare class ProductVariant extends BaseEntity {
    productId: string;
    colorId: string;
    sizeId: string;
    stockQuantity: number;
    priceOverride: number;
    product: Product;
    color: Color;
    size: Size;
}
