import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

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
  dob: string;

  gender?: string;
  user_type: string;
  id_profile: number;
  roles: string[];
}
