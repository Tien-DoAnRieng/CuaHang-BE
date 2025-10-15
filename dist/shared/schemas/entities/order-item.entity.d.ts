import { Order } from '../entities/order.entity';
import { ProductVariant } from '../entities/product-variant.entity';
export declare class OrderItem {
    orderId: string;
    variantId: string;
    quantity: number;
    priceAtTime: number;
    order: Order;
    variant: ProductVariant;
}
