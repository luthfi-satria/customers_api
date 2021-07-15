import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Hash } from 'src/hash/hash.decorator';
import { HashService } from 'src/hash/hash.service';
import { Repository } from 'typeorm';
import { OtpDocument } from '../database/entities/otp.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(OtpDocument)
    private readonly otpRepository: Repository<OtpDocument>,
    @Hash() private readonly hashService: HashService,
  ) {}

  async createOtp(data: Record<string, any>): Promise<OtpDocument> {
    const createotp: Partial<OtpDocument> = {
      //   id_otp: data.id_otp,
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

  async createAccessToken(payload: Record<string, any>): Promise<string> {
    return this.hashService.jwtSign(payload);
  }

  async validateAccessToken(
    token: string,
    payload?: boolean,
  ): Promise<boolean | Record<string, any>> {
    const verify: boolean = await this.hashService.jwtVerify(token);
    if (!verify) {
      return verify;
    }

    if (payload) {
      return this.hashService.jwtPayload(token);
    }

    return verify;
  }

  async createBasicToken(
    clientId: string,
    clientSecret: string,
  ): Promise<string> {
    const token = `${clientId}:${clientSecret}`;
    return this.hashService.encryptBase64(token);
  }

  async validateBasicToken(
    clientBasicToken: string,
    ourBasicToken: string,
  ): Promise<boolean> {
    if (ourBasicToken !== clientBasicToken) {
      return false;
    }
    return true;
  }
}
