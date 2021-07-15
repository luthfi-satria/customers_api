import { IsNotEmpty } from 'class-validator';

export class CustomerLoginPhoneValidation {
  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  phone: string;
}
