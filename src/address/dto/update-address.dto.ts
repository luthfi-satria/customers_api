import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsEmpty,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { CreateAddressDto } from './create-address.dto';
import { GroupType } from 'src/database/entities/address.entity';

export class UpdateAddressDto extends PartialType(CreateAddressDto) {
  @IsOptional()
  id?: string;

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

  city_id: string;

  @IsOptional()
  @IsString()
  postal_code: string;

  @IsOptional()
  @IsBoolean()
  is_active: boolean;

  @IsEmpty()
  customer_id: string;

  @IsOptional()
  customer_detail: string;

  @IsOptional()
  @IsEnum(GroupType, { message: 'Type yang anda masukan salah.' })
  type: GroupType;
}
