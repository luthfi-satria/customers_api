import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @Column({ default: '-6.175392' }) //monas
  lat: string;

  @Column({ default: '106.827153' }) //monas
  long: string;

  @Column({ default: false })
  is_active: boolean;

  @CreateDateColumn({ nullable: true })
  created_at: Date;

  @UpdateDateColumn({ nullable: true })
  updated_at: Date;
}
