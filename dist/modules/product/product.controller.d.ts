import { ProductService } from './product.service';
import { Product } from '../../shared/schemas/entities/product.entity';
export declare class ProductController {
    private readonly productService;
    constructor(productService: ProductService);
    create(data: Partial<Product>): Promise<Product>;
    findAll(query: any): Promise<{
        data: Product[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<Product | null>;
    update(id: string, data: Partial<Product>): Promise<Product | null>;
    remove(id: string): Promise<void>;
}
