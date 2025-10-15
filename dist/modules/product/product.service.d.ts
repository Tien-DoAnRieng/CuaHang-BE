import { Repository } from 'typeorm';
import { Product } from '../../shared/schemas/entities/product.entity';
import { Category } from '../../shared/schemas/entities/category.entity';
export declare class ProductService {
    private productRepository;
    private categoryRepository;
    constructor(productRepository: Repository<Product>, categoryRepository: Repository<Category>);
    create(data: Partial<Product>): Promise<Product>;
    findAll(query: any): Promise<{
        data: Product[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<Product | null>;
    findOneOrNull(id: string): Promise<Product | null>;
    update(id: string, data: Partial<Product>): Promise<Product | null>;
    remove(id: string): Promise<void>;
}
