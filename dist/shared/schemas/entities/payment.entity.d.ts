import { BaseEntity } from '../../../shared/schemas/base.entity';
import { Order } from './order.entity';
export declare class Payment extends BaseEntity {
    orderId: string;
    paymentMethod: string;
    status: string;
    paymentTime: Date;
    order: Order;
}
