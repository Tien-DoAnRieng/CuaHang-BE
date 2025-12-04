import { Column, Entity, OneToMany} from 'typeorm';
import { BaseEntity } from '../../../shared/schemas/base.entity';
import { ColorSize } from './color-size.entity';

@Entity('sizes')
export class Size extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;
    @OneToMany(() => ColorSize, cs => cs.size)
  colorSizes: ColorSize[];
}
