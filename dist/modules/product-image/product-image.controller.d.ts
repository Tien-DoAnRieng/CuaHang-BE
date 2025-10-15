import { Repository } from 'typeorm';
import { ProductImage } from '../../shared/schemas/entities/product-image.entity';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
export declare class ProductImageController {
    private readonly imageRepository;
    constructor(imageRepository: Repository<ProductImage>);
    create(dto: CreateProductImageDto): Promise<ProductImage>;
    findAll(query: any): Promise<ProductImage[]>;
    findOne(id: string): Promise<ProductImage | null>;
    update(id: string, dto: UpdateProductImageDto): Promise<ProductImage | null>;
    remove(id: string): Promise<import("typeorm").DeleteResult>;
}
