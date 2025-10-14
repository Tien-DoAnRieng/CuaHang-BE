
import { CreateDateColumn, PrimaryColumn, UpdateDateColumn, BeforeInsert } from 'typeorm';
import { randomUUID } from 'crypto';

export abstract class BaseEntity {
  @PrimaryColumn('char', { length: 36 })
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;


  @BeforeInsert()
  ensureId() {
    if (!this.id) {
   
      this.id = randomUUID();
    }
  }
}
