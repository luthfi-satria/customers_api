import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { validateOrReject } from 'class-validator';
import { ProfileDocument } from 'src/database/entities/profile.entity';
import { Hash } from 'src/hash/hash.decorator';
import { HashService } from 'src/hash/hash.service';
import { Repository } from 'typeorm';
import { OtpDocument } from '../database/entities/otp.entity';
import { CustomerLoginEmailValidation } from './validation/customers.loginemail.validation';
import { CustomerLoginPhoneValidation } from './validation/customers.loginphone.validation';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(OtpDocument)
    private readonly otpRepository: Repository<OtpDocument>,
    @InjectRepository(ProfileDocument)
    private readonly profileRepository: Repository<ProfileDocument>,
    @Hash() private readonly hashService: HashService,
  ) {}

  async createOtp(data: Record<string, any>): Promise<OtpDocument> {
    const createotp: Partial<OtpDocument> = {
      // id_otp: data.id_otp,
      phone: data.phone,
      referral_code: data.referral_code,
      otp_code: data.otp_code,
    };

    return this.otpRepository.save(createotp);
  }

  async updateFullOtp(data: Record<string, any>): Promise<OtpDocument> {
    const createotp: OtpDocument = {
      id_otp: data.id_otp,
      phone: data.phone,
      referral_code: data.referral_code,
      otp_code: data.otp_code,
      validated: data.validated,
    };

    return this.otpRepository.save(createotp);
  }

  findOneOtpByPhone(id: string): Promise<OtpDocument> {
    return this.otpRepository.findOne({ where: { phone: id } });
  }

  findOneOtpByIDPhone(id: number, phone: string): Promise<OtpDocument> {
    return this.otpRepository.findOne({
      where: { id_profile: id, phone: phone },
    });
  }

  findOneCustomerByPhone(id: string): Promise<ProfileDocument> {
    return this.profileRepository.findOne({ where: { phone: id } });
  }

  findOneCustomerByEmail(id: string): Promise<ProfileDocument> {
    return this.profileRepository.findOne({ where: { email: id } });
  }

  async createCustomerProfile(
    data: Record<string, any>,
  ): Promise<ProfileDocument> {
    const salt: string = await this.hashService.randomSalt();
    const passwordHash = await this.hashService.hashPassword(
      data.password,
      salt,
    );
    const create_profile: Partial<ProfileDocument> = {
      phone: data.phone,
      name: data.name,
      email: data.email,
      password: passwordHash,
      dob: data.dob,
    };

    return this.profileRepository.save(create_profile);
  }
  //--------------------------------------------------------------

  async createAccessToken(payload: Record<string, any>): Promise<string> {
    return this.hashService.jwtSign(payload);
  }

  async validateAccessToken(token: string): Promise<Record<string, any>> {
    return this.hashService.jwtPayload(token);
  }

  async validateCustomer(
    passwordString: string,
    passwordHash: string,
  ): Promise<boolean> {
    return this.hashService.bcryptComparePassword(passwordString, passwordHash);
  }

  async validateLoginEmail(input: Record<string, any>): Promise<any> {
    const data = new CustomerLoginEmailValidation();
    data.email = input.email;
    data.password = input.password;

    try {
      return await validateOrReject(data);
    } catch (errors) {
      console.log('Validation failed. Errors: ', errors);
      return errors;
    }
  }

  async validateLoginPhone(input: Record<string, any>): Promise<any> {
    const data = new CustomerLoginPhoneValidation();
    data.phone = input.phone;
    data.password = input.password;

    try {
      return await validateOrReject(data);
    } catch (errors) {
      console.log('Validation failed. Errors: ', errors);
      return errors;
    }
  }
}
