import { Category } from '../../shared/schemas/entities/category.entity';
import { Repository } from 'typeorm';
export declare class CategoryController {
    private readonly categoryRepository;
    constructor(categoryRepository: Repository<Category>);
    create(data: Partial<Category>): Promise<Category>;
    findAll(): Promise<Category[]>;
    findOne(id: string): Promise<Category | null>;
    update(id: string, data: Partial<Category>): Promise<Category | null>;
    remove(id: string): Promise<import("typeorm").DeleteResult>;
}
