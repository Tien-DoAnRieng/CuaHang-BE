import { BaseEntity } from '../../../shared/schemas/base.entity';
import { User } from '../../../shared/schemas/entities/user.entity';
import { Address } from './address.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from '../entities/payment.entity';
export declare class Order extends BaseEntity {
    userId: string;
    totalAmount: number;
    status: string;
    paymentMethod: string;
    shippingAddressId: string;
    user: User;
    shippingAddress: Address;
    items: OrderItem[];
    payments: Payment[];
}
