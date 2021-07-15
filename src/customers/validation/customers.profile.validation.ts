import { IsEmail, IsNotEmpty } from 'class-validator';

export class CustomerProfileValidation {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  dob: string;

  gender: string;
}
