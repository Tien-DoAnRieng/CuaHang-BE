import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ai_configs')
export class AiConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true, name: 'system_instruction' })
  systemInstruction: string;

  @Column({ type: 'text', nullable: true, name: 'business_rules' })
  businessRules: string;

  @Column({ type: 'float', default: 0.3 })
  temperature: number;

  @Column({ type: 'int', default: 8, name: 'max_history_turns' })
  maxHistoryTurns: number;

  @Column({ type: 'text', nullable: true, name: 'emergency_keywords' })
  emergencyKeywords: string;

  @Column({ type: 'boolean', default: true, name: 'is_enabled' })
  isEnabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
