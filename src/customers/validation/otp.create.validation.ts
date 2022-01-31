import {
  IsEmail,
  IsMobilePhone,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  Length,
} from 'class-validator';

export class OtpCreateValidation {
  @IsOptional()
  name?: string;

  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 15)
  @IsMobilePhone('' as any, {}, { message: 'Format nomor telepon salah' })
  phone: string;

  referral_code?: string;

  otp_code?: string;
  user_type?: string;
  id?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Format email tidak benar' })
  email?: string;

  @IsOptional()
  token?: string;
}
