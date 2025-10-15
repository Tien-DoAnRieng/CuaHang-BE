import { BaseEntity } from '../../../shared/schemas/base.entity';
import { User } from '../../../shared/schemas/entities/user.entity';
import { CartItem } from './cart-item.entity';
export declare class Cart extends BaseEntity {
    userId: string;
    user: User;
    items: CartItem[];
}
