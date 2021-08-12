import {
  IsBoolean,
  IsEmpty,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
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
  @IsString()
  @IsLatitude({ message: 'Latitude yang anda masukan salah.' })
  lat: string;

  @IsNotEmpty()
  @IsString()
  @IsLongitude({ message: 'Longitude yang anda masukan salah.' })
  long: string;

  @IsNotEmpty()
  @IsBoolean()
  is_active: boolean;

  @IsEmpty()
  customer_id: string;
}
