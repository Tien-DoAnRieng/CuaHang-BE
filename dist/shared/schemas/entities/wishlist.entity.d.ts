import { User } from '../../../shared/schemas/entities/user.entity';
import { Product } from '../entities/product.entity';
export declare class Wishlist {
    userId: string;
    productId: string;
    createdAt: Date;
    user: User;
    product: Product;
}
