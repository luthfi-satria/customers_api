import { HttpService, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProfileDocument } from 'src/database/entities/profile.entity';
import { Repository } from 'typeorm';
import { Observable } from 'rxjs';
import { AxiosResponse } from 'axios';
import { catchError, map } from 'rxjs/operators';
import { compare, genSalt, hash } from 'bcrypt';
import { HashService } from 'src/hash/hash.service';
import { Hash } from 'src/hash/hash.decorator';
import * as moment from 'moment';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(ProfileDocument)
    private readonly profileRepository: Repository<ProfileDocument>,
    private httpService: HttpService,
    @Hash() private readonly hashService: HashService,
  ) {}

  async findOne(id: string) {
    const profile = await this.profileRepository.findOne({
      relations: ['address'],
      where: {
        id_profile: id,
      },
    });
    return profile;
  }

  findOneCustomerByPhone(id: string): Promise<ProfileDocument> {
    return this.profileRepository.findOne({ where: { phone: id } });
  }

  findOneCustomerByEmail(email: string): Promise<ProfileDocument> {
    return this.profileRepository.findOne({ where: { email } });
  }

  async findOneCustomerByEmailExceptId(
    email: string,
    id: string,
  ): Promise<ProfileDocument> {
    try {
      const profile = await this.profileRepository
        .createQueryBuilder()
        .where('email = :email', { email: email })
        .andWhere('id_profile != :id', { id: id })
        .getOne();
      return profile;
    } catch (error: any) {
      return null;
    }
  }

  findOneCustomerById(id: string): Promise<ProfileDocument> {
    return this.profileRepository.findOne({ where: { id_profile: id } });
  }

  async createCustomerProfile(
    data: Record<string, any>,
    flg_update: boolean,
  ): Promise<ProfileDocument> {
    // const salt: string = await this.hashService.randomSalt();
    // const passwordHash = await this.hashService.hashPassword(
    //   data.password,
    //   salt,
    // );
    const create_profile: Partial<ProfileDocument> = {
      phone: data.phone,
      name: data.name,
      email: data.email,
      // password: passwordHash,
    };
    if (data.dob) {
      create_profile.dob = moment(data.dob, 'DD/MM/YYYY', true).toDate();
    }
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
    const defaultPasswordSaltLength = Number(
      process.env.HASH_PASSWORDSALTLENGTH,
    );

    return genSalt(defaultPasswordSaltLength);
  }

  async bcryptComparePassword(
    passwordString: string,
    passwordHashed: string,
  ): Promise<boolean> {
    return compare(passwordString, passwordHashed);
  }

  async postHttp(
    url: string,
    body: Record<string, any>,
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
    headers: Record<string, any>,
  ): Promise<Observable<AxiosResponse<any>>> {
    return this.httpService.put(url, body, { headers: headers }).pipe(
      map((response) => response.data),
      catchError((err) => {
        throw err;
      }),
    );
  }
}
