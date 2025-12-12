import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/schemas/base.entity';
import { Product } from './product.entity';

@Entity('brands')
export class Brand extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => Product, (product) => product.brandEntity)
  products: Product[];
}




