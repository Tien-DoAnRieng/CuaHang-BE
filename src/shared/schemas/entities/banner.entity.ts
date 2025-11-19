   import { BaseEntity } from '../../../shared/schemas/base.entity';
        import { Column, Entity } from 'typeorm';
        
    @Entity('banners')
     export class Banner extends BaseEntity { 
         @Column({ length: 255 }) title: string;
            @Column({ type: 'text', nullable: true }) description?: string; 
              @Column({ length: 255, nullable: true }) imageUrl?: string;  
              
              
              @Column({ type: 'boolean', default: true }) active: boolean;  
    @Column({ type: 'int', default: 0 }) priority: number;  
 }