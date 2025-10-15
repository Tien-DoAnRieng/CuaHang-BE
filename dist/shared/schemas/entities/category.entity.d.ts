import { BaseEntity } from '../../../shared/schemas/base.entity';
import { Product } from './product.entity';
export declare class Category extends BaseEntity {
    name: string;
    description: string;
    parentId: string;
    parent: Category;
    children: Category[];
    products: Product[];
}
