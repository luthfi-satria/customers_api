import { IsEmail, IsNotEmpty, IsNumberString, Length } from 'class-validator';

export class EmailVerificationEmailVerifyValidation {
  @IsNotEmpty({ message: 'Token tidak boleh kosong' })
  token: string;
}
