import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsEmpty,
  IsLatitude,
  IsLongitude,
  IsNumber,
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
  @IsNumber()
  @IsLatitude({ message: 'Latitude yang anda masukan salah.' })
  location_latitude: number;

  @IsOptional()
  @IsNumber()
  @IsLongitude({ message: 'Longitude yang anda masukan salah.' })
  location_longitude: number;

  @IsOptional()
  @IsBoolean()
  is_active: boolean;

  @IsEmpty()
  customer_id: string;
}
