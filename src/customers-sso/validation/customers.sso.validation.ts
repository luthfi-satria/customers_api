import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CustomerLoginSsoValidation {
  @IsEmail()
  @IsOptional()
  email: string;

  @IsOptional()
  @IsString()
  phone_number: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
