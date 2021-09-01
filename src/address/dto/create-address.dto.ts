import {
  IsBoolean,
  IsEmpty,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { GroupType } from 'src/database/entities/address.entity';

export class CreateAddressDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsNumber()
  @IsLatitude({ message: 'Latitude yang anda masukan salah.' })
  location_latitude: number;

  @IsNotEmpty()
  @IsNumber()
  @IsLongitude({ message: 'Longitude yang anda masukan salah.' })
  location_longitude: number;

  city_id: string;

  @IsNotEmpty()
  @IsString()
  postal_code: string;

  @IsNotEmpty()
  @IsBoolean()
  is_active: boolean;

  @IsEmpty()
  customer_id: string;

  @IsOptional()
  customer_detail: string;

  @IsEnum(GroupType, { message: 'Type yang anda masukan salah.' })
  type: GroupType;
}
