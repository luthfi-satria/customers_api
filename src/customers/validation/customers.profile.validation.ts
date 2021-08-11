import { IsEmail, IsNotEmpty, IsOptional, Validate } from 'class-validator';
import { ValidDOBRule } from './valid-dob.rule';

export class CustomerProfileValidation {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsNotEmpty()
  @Validate(ValidDOBRule, {
    message: 'Format tanggal lahir tidak valid (dd/mm/yyyy)',
  })
  dob: string;

  gender?: string;
  user_type: string;
  id_profile: number;
  roles: string[];
}
