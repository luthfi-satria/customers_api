import { IsNotEmpty } from 'class-validator';

export class CustomerLoginPhoneValidation {
  @IsNotEmpty()
  phone: string;
}
