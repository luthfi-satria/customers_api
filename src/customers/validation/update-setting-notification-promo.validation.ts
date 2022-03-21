import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateSettingNotificationPromoValidation {
  @IsNotEmpty()
  @IsBoolean()
  allow_notification_promo: boolean;
}
