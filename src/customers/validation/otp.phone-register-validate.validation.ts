import { IsNotEmpty, IsNumberString, IsString, Length } from 'class-validator';

export class OtpPhoneRegisterValidateValidation {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 15)
  phone: string;

  @IsNotEmpty()
  @Length(4, 4)
  @IsNumberString()
  otp_code: string;
  user_type: string;
  id_profile: number;
  id: string;
  roles: string[];
  created_at: Date;
}
