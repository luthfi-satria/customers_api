import { IsBoolean, IsNotEmpty } from 'class-validator';
import { CustomerProfileValidation } from './customers.profile.validation';

export class AdminCustomerProfileValidation extends CustomerProfileValidation {
  @IsNotEmpty()
  @IsBoolean()
  is_active: boolean;
}
