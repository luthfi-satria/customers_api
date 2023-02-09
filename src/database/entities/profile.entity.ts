import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Address } from './address.entity';

export enum Gender {
  Male = 'MALE',
  Female = 'FEMALE',
}

@Entity({ name: 'customers_profile' })
export class ProfileDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: '15' })
  phone: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'date', nullable: true })
  dob: Date;

  @Column({ nullable: true })
  photo: string;

  @Column({ nullable: true })
  verification_token: string;

  @Column({ type: 'timestamp', nullable: true })
  phone_verified_at: Date;

  @Column({ nullable: false, default: true })
  is_active: boolean;

  @Column({ nullable: false, default: true })
  allow_notification_promo: boolean;

  @Column({
    type: 'enum',
    enum: Gender,
    default: null,
  })
  gender: Gender;

  @Column({ type: 'timestamp', nullable: true })
  email_verified_at: Date;

  @CreateDateColumn({ nullable: true })
  created_at: Date;

  @UpdateDateColumn({ nullable: true })
  updated_at: Date;

  @OneToMany(() => Address, (address) => address.customer)
  addresses: Address[];

  @OneToMany(() => Address, (address) => address.customer)
  active_addresses: Address[];

  @Column({ nullable: true })
  sso_id: number;
}
