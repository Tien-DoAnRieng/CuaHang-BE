import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../shared/schemas/base.entity';

@Entity('files')
export class FileEntity extends BaseEntity {
  @Column()
  filename: string;

  @Column()
  originalname: string;

  @Column()
  mimetype: string;

  @Column()
  size: number;

  @Column()
  url: string;

  @Column({ nullable: true })
  purpose: string;

  @Column({ nullable: true })
  entityType: string;

  @Column({ nullable: true })
  entityId: string;
}