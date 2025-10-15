import { Repository } from 'typeorm';
import { ProductVariant } from '../../shared/schemas/entities/product-variant.entity';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
export declare class ProductVariantController {
    private readonly variantRepository;
    constructor(variantRepository: Repository<ProductVariant>);
    create(dto: CreateProductVariantDto): Promise<ProductVariant>;
    findAll(query: any): Promise<ProductVariant[]>;
    findOne(id: string): Promise<ProductVariant | null>;
    update(id: string, dto: UpdateProductVariantDto): Promise<ProductVariant | null>;
    remove(id: string): Promise<import("typeorm").DeleteResult>;
}
