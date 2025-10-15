import { BaseEntity } from '../../../shared/schemas/base.entity';
import { User } from '../../../shared/schemas/entities/user.entity';
import { Product } from '../../schemas/entities/product.entity';
export declare class Review extends BaseEntity {
    userId: string;
    productId: string;
    rating: number;
    comment: string;
    user: User;
    product: Product;
}
