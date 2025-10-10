import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../shared/schemas/base.entity';

@Entity('colors')
export class Color extends BaseEntity {
  @Column()
  name: string;

  @Column({ name: 'hex_code' })
  hexCode: string;
}
