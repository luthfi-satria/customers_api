import { IsNotEmpty } from 'class-validator';

export class CustomerResetPasswordValidation {
  @IsNotEmpty()
  password: string;

  passwordHash: string;
  phone: any;
}
