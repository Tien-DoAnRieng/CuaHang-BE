import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/schemas/base.entity';

@Entity('categories')
export class Category extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'parent_id', nullable: true })
  parentId: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'parent_id' })
  parent: Category;

  @OneToMany(() => Category, (category: Category) => category.parent)
  children: Category[];
}