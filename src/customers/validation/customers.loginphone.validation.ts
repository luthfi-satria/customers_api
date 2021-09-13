import { IsNotEmpty, IsNumberString } from 'class-validator';

export class CustomerLoginPhoneValidation {
  @IsNotEmpty({ message: 'Nomor telpon tidak boleh kosong' })
  @IsNumberString({}, { message: 'Harus angka' })
  phone: string;
}
