import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsEmpty,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  Length,
  Validate,
} from 'class-validator';
import { Gender } from 'src/database/entities/profile.entity';
import { ValidDOBRule } from './valid-dob.rule';

export class CustomerProfileValidation {
  @IsOptional()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsNotEmpty()
  @Validate(ValidDOBRule, {
    message: 'Format tanggal lahir tidak valid (dd/mm/yyyy)',
  })
  dob: string;

  @IsOptional()
  @IsNotEmpty()
  @IsEnum(Gender, { message: 'Gender tidak valid' })
  gender: Gender;

  user_type: string;
  id_profile: number;
  roles: string[];

  @IsOptional()
  photo: string;

  @IsOptional()
  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 15)
  phone: string;

  @IsOptional()
  id: string;
}

export class QueryFilterDto { 
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page: number;

  @IsOptional()
  status: string;

  @IsOptional()
  search: string;
}
