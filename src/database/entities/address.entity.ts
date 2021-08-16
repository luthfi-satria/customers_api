import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ColumnNumericTransformer } from '../helper/column_numberic_transformer';

import { ProfileDocument } from './profile.entity';

@Entity({ name: 'customers_address' })
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProfileDocument, (profile) => profile.id_profile)
  @JoinColumn({ name: 'customer_id' })
  customer: ProfileDocument;

  @Column()
  customer_id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  address: string;

  @Column('decimal', {
    default: '-6.175392',
    transformer: new ColumnNumericTransformer(),
  }) //monas
  location_latitude: number;

  @Column('decimal', {
    default: '106.827153',
    transformer: new ColumnNumericTransformer(),
  }) //monas
  location_longitude: number;

  @Column({ default: false })
  is_active: boolean;

  @CreateDateColumn({ nullable: true })
  created_at: Date;

  @UpdateDateColumn({ nullable: true })
  updated_at: Date;
}
