import { Column, Entity, BeforeInsert } from 'typeorm';
import { BaseEntity } from '../../../shared/schemas/base.entity';

@Entity('colors')
export class Color extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ name: 'hex_code', length: 7 })
  hexCode: string;

  @BeforeInsert()
  validateHexCode() {
    if (this.hexCode && !this.hexCode.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)) {
      throw new Error('Invalid hex code format');
    }
  }
}