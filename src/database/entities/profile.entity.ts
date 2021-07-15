import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'customers_pofile' })
export class ProfileDocument {
  @PrimaryGeneratedColumn()
  id_profile: number;

  @Column({ length: '15' })
  phone: string;

  @Column()
  name: string;

  @Column()
  password: string;

  @Column()
  email: string;

  @Column({ type: 'date' })
  dob: Date;

  @CreateDateColumn({ nullable: true })
  created_at: Date;

  @UpdateDateColumn({ nullable: true })
  updated_at: Date;
}
