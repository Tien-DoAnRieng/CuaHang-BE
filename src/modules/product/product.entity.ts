import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Category } from '../category/category.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal' })
  price: number;

  @Column({ type: 'varchar' })
  brand: string;

  @ManyToOne(() => Category, (category) => category.products)
  category: Category;

  @Column({ type: 'varchar', default: 'ACTIVE' })
  status: string;
}
