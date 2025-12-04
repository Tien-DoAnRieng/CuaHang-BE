import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/schemas/base.entity';
import { Color } from './color.entity';
import { Size } from './size.entity';

@Entity('color_sizes')
export class ColorSize extends BaseEntity {
  @Column({ name: 'color_id' })
  colorId: string;

  @Column({ name: 'size_id' })
  sizeId: string;

  @ManyToOne(() => Color, color => color.sizes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'color_id' })
  color: Color;

  @ManyToOne(() => Size, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'size_id' })
  size: Size;
}
