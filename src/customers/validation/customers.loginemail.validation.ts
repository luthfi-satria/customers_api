import { IsEmail, IsNotEmpty } from 'class-validator';

export class CustomerLoginEmailValidation {
  @IsNotEmpty()
  password: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
