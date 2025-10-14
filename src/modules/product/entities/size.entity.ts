import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../shared/schemas/base.entity';

@Entity('sizes')
export class Size extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;
}