import { Repository } from 'typeorm';
import { ProductImage } from '../../shared/schemas/entities/product-image.entity';
export declare class ProductImageService {
    private readonly imageRepository;
    constructor(imageRepository: Repository<ProductImage>);
    create(data: Partial<ProductImage>): Promise<ProductImage>;
    findAll(query: any): Promise<ProductImage[]>;
    findOne(id: string): Promise<ProductImage | null>;
    update(id: string, data: Partial<ProductImage>): Promise<ProductImage | null>;
    remove(id: string): Promise<import("typeorm").DeleteResult>;
}
