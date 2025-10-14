import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { Product } from '../product/product.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @ManyToOne(() => Category, (category) => category.children, { nullable: true })
  parent: Category;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  // Relation with products
  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
