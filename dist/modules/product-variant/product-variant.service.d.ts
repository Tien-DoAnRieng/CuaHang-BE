import { Repository } from 'typeorm';
import { ProductVariant } from '../../shared/schemas/entities/product-variant.entity';
export declare class ProductVariantService {
    private readonly variantRepository;
    constructor(variantRepository: Repository<ProductVariant>);
    create(data: Partial<ProductVariant>): Promise<ProductVariant>;
    findAll(query: any): Promise<ProductVariant[]>;
    findOne(id: string): Promise<ProductVariant | null>;
    update(id: string, data: Partial<ProductVariant>): Promise<ProductVariant | null>;
    remove(id: string): Promise<import("typeorm").DeleteResult>;
}
