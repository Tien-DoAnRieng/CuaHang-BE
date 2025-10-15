import { Cart } from '../entities/cart.entity';
import { ProductVariant } from '../entities/product-variant.entity';
export declare class CartItem {
    cartId: string;
    variantId: string;
    quantity: number;
    cart: Cart;
    variant: ProductVariant;
}
