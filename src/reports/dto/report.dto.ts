import {
  IsArray,
  IsDateString,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class ListReprotNewCustomerDTO {
  @IsOptional()
  search: string;

  @IsOptional()
  @IsNumberString({}, { message: 'Limit yang diisi bukan format number' })
  limit: number;

  @IsOptional()
  @IsNumberString({}, { message: 'Page yang diisi bukan format number' })
  page: string;

  @IsDateString()
  @IsOptional()
  date_start?: string;

  @IsDateString()
  @IsOptional()
  date_end?: string;

  @IsOptional()
  status: string;

  city_id: string;

  @IsOptional()
  @IsArray()
  columns?: string[];

  @IsOptional()
  @IsString()
  sheet_name?: string;
}
