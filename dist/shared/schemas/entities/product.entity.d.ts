import { Category } from '../../../shared/schemas/entities/category.entity';
export declare class Product {
    id: string;
    name: string;
    description: string;
    price: number;
    brand: string;
    category: Category;
    status: string;
}
