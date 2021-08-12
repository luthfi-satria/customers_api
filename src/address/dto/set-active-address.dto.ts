import { PartialType } from '@nestjs/mapped-types';
import { CreateAddressDto } from './create-address.dto';

export class SetActiveAddressDto extends PartialType(CreateAddressDto) {
  id: string;

  is_active: boolean;

  customer_id: string;
}
