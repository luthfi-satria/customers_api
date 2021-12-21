import { IsEmail, IsNotEmpty } from 'class-validator';

export class CustomerChangeEmailValidation {
  @IsEmail()
  @IsNotEmpty({ message: 'Email baru tidak boleh kosong' })
  email: string;
}
