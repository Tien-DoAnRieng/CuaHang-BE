import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../shared/schemas/base.entity';

@Entity('addresses')
export class Address extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'recipient_name' })
  recipientName: string;

  @Column()
  phone: string;

  @Column({ name: 'full_address', type: 'text' })
  fullAddress: string;

  @Column()
  ward: string;

  @Column()
  district: string;

  @Column()
  province: string;
}
