import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base.entity';

@Entity('colors')
export class Color extends BaseEntity {
  @Column()
  name: string;

  @Column({ name: 'hex_code' })
  hexCode: string;

  constructor(partial: Partial<Color>) {
    super();
    Object.assign(this, partial);
  }
}
