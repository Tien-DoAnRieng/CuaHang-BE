import { BaseEntity } from '../base.entity';
export declare class FileEntity extends BaseEntity {
    filename: string;
    originalname: string;
    mimetype: string;
    size: number;
    url: string;
    purpose: string;
    entityType: string;
    entityId: string;
}
