import { PartialType } from '@nestjs/mapped-types';
import { IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';
import { CreateAddressDto } from './create-address.dto';

export class SelectAddressDto extends PartialType(CreateAddressDto) {
  @IsOptional()
  @IsString()
  search: string;

  @IsOptional()
  @IsNumberString()
  page = '1';

  @IsOptional()
  @IsNumberString()
  limit = '10';

  @IsOptional()
  @IsUUID()
  @IsString()
  id_profile: string;
}
