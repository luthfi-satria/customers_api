import { IsEmail, IsNotEmpty } from 'class-validator';

export class CustomerLoginEmailValidation {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
