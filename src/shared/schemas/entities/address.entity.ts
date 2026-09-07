

import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { User } from '../../schemas/entities/user.entity';
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

    @Column({ default: false })
    isDefault: boolean;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    constructor(partial: Partial<Address>) {
      super();
      Object.assign(this, partial);
    }

}
