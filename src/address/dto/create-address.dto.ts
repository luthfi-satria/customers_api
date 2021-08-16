import {
  IsBoolean,
  IsEmpty,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

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

  @IsNotEmpty()
  @IsBoolean()
  is_active: boolean;

  @IsEmpty()
  customer_id: string;
}
