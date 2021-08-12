import { PartialType } from '@nestjs/mapped-types';
import { IsNumberString, IsOptional, IsString } from 'class-validator';
import { CreateAddressDto } from './create-address.dto';

export class SelectAddressDto extends PartialType(CreateAddressDto) {
  @IsOptional()
  @IsString()
  search: string;

  @IsOptional()
  @IsNumberString()
  page: number;

  @IsOptional()
  @IsNumberString()
  limit: number;
}
