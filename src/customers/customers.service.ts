import {
  BadRequestException,
  HttpService,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { validateOrReject } from 'class-validator';
import { ProfileDocument } from 'src/database/entities/profile.entity';
import { Repository } from 'typeorm';
import { CustomerLoginEmailValidation } from './validation/customers.loginemail.validation';
import { CustomerLoginPhoneValidation } from './validation/customers.loginphone.validation';
import { Observable } from 'rxjs';
import { AxiosResponse } from 'axios';
import { catchError, map } from 'rxjs/operators';
import { RMessage } from 'src/response/response.interface';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { compare, genSalt, hash } from 'bcrypt';
import { HashService } from 'src/hash/hash.service';
import { Hash } from 'src/hash/hash.decorator';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(ProfileDocument)
    private readonly profileRepository: Repository<ProfileDocument>,
    private httpService: HttpService,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    @Hash() private readonly hashService: HashService,
  ) {}

  findOneCustomerByPhone(id: string): Promise<ProfileDocument> {
    return this.profileRepository.findOne({ where: { phone: id } });
  }

  findOneCustomerByEmail(id: string): Promise<ProfileDocument> {
    return this.profileRepository.findOne({ where: { email: id } });
  }

  async createCustomerProfile(
    data: Record<string, any>,
    flg_update: boolean,
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
    if (flg_update) {
      create_profile.id_profile = data.id_profile;
    }
    return this.profileRepository.save(create_profile);
  }

  async createCustomerProfileOTP(
    data: Record<string, any>,
  ): Promise<ProfileDocument> {
    const create_profile: Partial<ProfileDocument> = {
      phone: data.phone,
    };
    return this.profileRepository.save(create_profile);
  }

  async updateCustomerProfile(
    data: Record<string, any>,
  ): Promise<ProfileDocument> {
    return this.profileRepository.save(data);
  }

  //--------------------------------------------------------------

  // bcrypt
  async hashPassword(passwordString: string, salt: string): Promise<string> {
    return hash(passwordString, salt);
  }

  async randomSalt(): Promise<string> {
    // Env Variable
    const defaultPasswordSaltLength = Number(process.env.passwordSaltLength);

    return genSalt(defaultPasswordSaltLength);
  }

  async validatePassword(
    passwordString: string,
    passwordHash: string,
  ): Promise<boolean> {
    return this.bcryptComparePassword(passwordString, passwordHash);
  }

  async bcryptComparePassword(
    passwordString: string,
    passwordHashed: string,
  ): Promise<boolean> {
    return compare(passwordString, passwordHashed);
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

  async postHttp(
    url: string,
    body: Record<string, any>,
    msgHandler: Record<string, any>,
    headers: Record<string, any>,
  ): Promise<Observable<AxiosResponse<any>>> {
    return this.httpService.post(url, body, { headers: headers }).pipe(
      map((response) => response.data),
      catchError((err) => {
        throw err;
      }),
    );
  }

  async putHttp(
    url: string,
    body: Record<string, any>,
    msgHandler: Record<string, any>,
    headers: Record<string, any>,
  ): Promise<Observable<AxiosResponse<any>>> {
    return this.httpService.put(url, body, { headers: headers }).pipe(
      map((response) => response.data),
      catchError((err) => {
        const logger = new Logger();
        logger.debug('error: ' + err);
        const errors: RMessage = {
          value: '',
          property: msgHandler.property,
          constraint: [this.messageService.get(msgHandler.map)],
        };
        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            errors,
            'Internal Server Error',
          ),
        );
      }),
    );
  }
}
