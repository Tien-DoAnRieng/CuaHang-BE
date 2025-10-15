import { BaseEntity } from '../../../shared/schemas/base.entity';
export declare class Address extends BaseEntity {
    userId: string;
    recipientName: string;
    phone: string;
    fullAddress: string;
    ward: string;
    district: string;
    province: string;
}
