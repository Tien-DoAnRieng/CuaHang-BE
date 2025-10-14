import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../shared/schemas/base.entity';

@Entity('roles')
export class Role extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;
}