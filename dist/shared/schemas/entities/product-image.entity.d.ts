import { BaseEntity } from '../../../shared/schemas/base.entity';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';
export declare class ProductImage extends BaseEntity {
    productId: string;
    variantId?: string;
    imageUrl: string;
    isMain: boolean;
    product: Product;
    variant?: ProductVariant;
}
