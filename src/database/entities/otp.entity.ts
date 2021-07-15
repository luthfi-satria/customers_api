import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'otp' })
export class OtpDocument {
  @PrimaryGeneratedColumn()
  id_otp: number;

  @Column({ length: '15' })
  phone: string;

  @Column()
  referral_code: string;

  @Column()
  otp_code: string;

  @Column({ default: false })
  validated: boolean;
}
