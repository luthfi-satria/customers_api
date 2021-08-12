import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
} from 'class-validator';
import { CreateAddressDto } from './create-address.dto';

export class UpdateAddressDto extends PartialType(CreateAddressDto) {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  @IsLatitude({ message: 'Latitude yang anda masukan salah.' })
  lat: string;

  @IsOptional()
  @IsString()
  @IsLongitude({ message: 'Longitude yang anda masukan salah.' })
  long: string;

  @IsOptional()
  @IsBoolean()
  is_active: boolean;
}
