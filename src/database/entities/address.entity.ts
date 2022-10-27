import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ColumnNumericTransformer } from '../helper/column_numberic_transformer';

import { ProfileDocument } from './profile.entity';

export enum GroupType {
  Home = 'home',
  Office = 'office',
  Custom = 'custom',
  Apartment = 'apartment',
}

@Entity({ name: 'customers_address' })
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProfileDocument, (profile) => profile.id)
  @JoinColumn({ name: 'customer_id' })
  customer: ProfileDocument;

  @Column()
  customer_id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ nullable: true })
  city_id: string;

  @Column({ nullable: true })
  postal_code: string;

  @Column('decimal', {
    // default: '-6.175392',
    transformer: new ColumnNumericTransformer(),
  }) //monas
  location_latitude: number;

  @Column('decimal', {
    // default: '106.827153',
    transformer: new ColumnNumericTransformer(),
  }) //monas
  location_longitude: number;

  @Column({ default: false })
  is_active: boolean;

  @Column({ default: '' })
  address_detail: string;

  @Column({
    type: 'enum',
    enum: GroupType,
    default: GroupType.Custom,
  })
  type: string;

  @CreateDateColumn({ nullable: true })
  created_at: Date;

  @UpdateDateColumn({ nullable: true })
  updated_at: Date;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;

  constructor(init?: Partial<Address>) {
    Object.assign(this, init);
  }
}
