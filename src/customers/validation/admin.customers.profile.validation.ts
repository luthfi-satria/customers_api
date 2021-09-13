import { IsBoolean, IsEnum, IsNotEmpty } from 'class-validator';
import { Gender } from 'src/database/entities/profile.entity';
import { CustomerProfileValidation } from './customers.profile.validation';

export class AdminCustomerProfileValidation extends CustomerProfileValidation {
  @IsNotEmpty()
  @IsBoolean()
  is_active: boolean;

  @IsNotEmpty()
  @IsEnum(Gender, { message: 'Gender tidak valid' })
  gender: Gender;
}
