import { IsNotEmpty } from 'class-validator';

export class EmailVerificationEmailVerifyValidation {
  @IsNotEmpty({ message: 'Token tidak boleh kosong' })
  token: string;
}
