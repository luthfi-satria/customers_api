import { IsDefined, IsOptional } from 'class-validator';

export class UpdateContactDto {
  @IsOptional()
  @IsDefined()
  contact_email: string;

  @IsOptional()
  @IsDefined()
  contact_phone: string;

  @IsOptional()
  @IsDefined()
  contact_website: string;

  @IsOptional()
  @IsDefined()
  contact_whatsapp: string;

  @IsOptional()
  @IsDefined()
  contact_instagram_account: string;

  @IsOptional()
  @IsDefined()
  contact_twitter_account: string;
}

export class UpdatePrivacyPolicyDto {
  @IsOptional()
  @IsDefined()
  privacy_hermes_id: string;

  @IsOptional()
  @IsDefined()
  privacy_efood_id: string;

  @IsOptional()
  @IsDefined()
  privacy_efood_en: string;
}

export class UpdateTosDto {
  @IsOptional()
  @IsDefined()
  tos_hermes_id: string;

  @IsOptional()
  @IsDefined()
  tos_efood_id: string;

  @IsOptional()
  @IsDefined()
  tos_efood_en: string;
}

export class UpdateLimitCreateOrderTicketDto {
  @IsOptional()
  @IsDefined()
  limit_create_order_ticket: string;
}
