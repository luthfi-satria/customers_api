import { IsEmail, IsNotEmpty, IsNumberString, Length } from 'class-validator';

export class OtpEmailValidateValidation {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @Length(4, 4)
  @IsNumberString()
  otp_code: string;

  name: string;
  user_type: string;
  id_profile: number;
  id: string;
  roles: string[];
  created_at: Date;
}
