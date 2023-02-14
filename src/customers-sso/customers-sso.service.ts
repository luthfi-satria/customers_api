import { HttpService } from '@nestjs/axios';
import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosResponse } from 'axios';
import { genSaltSync, hash } from 'bcrypt';
import { JwtPayload } from 'jsonwebtoken';
import { lastValueFrom, map } from 'rxjs';
import { Gender, ProfileDocument } from 'src/database/entities/profile.entity';
import { MessageService } from 'src/message/message.service';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { Repository } from 'typeorm';
import { CustomerLoginSsoValidation } from './validation/customers.sso.validation';

@Injectable()
export class CustomersSsoService {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly httpService: HttpService,
    @InjectRepository(ProfileDocument)
    private readonly customerRepo: Repository<ProfileDocument>,
  ) {}

  async loginSso(UsersData: CustomerLoginSsoValidation) {
    try {
      const sso_data = {};
      // IF EMAIL AND PASSWORD IS NOT EXISTS
      if (!UsersData.email && !UsersData.phone_number) {
        return this.returningError(['email or phone is requird']);
      }

      if (UsersData.email) {
        sso_data['email'] = UsersData.email;
      }

      if (UsersData.phone_number) {
        sso_data['phone_number'] = UsersData.phone_number;
      }

      sso_data['password'] = UsersData.password;

      const headerRequest = {
        'Content-Type': 'application/json',
      };
      const loginSSO = await this.httpAuthRequests(
        sso_data,
        'api/v1/auth/sso',
        headerRequest,
      );

      if (loginSSO && typeof loginSSO.access_token != 'undefined') {
        const decode = this.decodeSsoToken(loginSSO);

        // CHECKING USER EXISTENCES IN EFOOD && GENERATE EFOOD TOKEN
        const verifyUser = await this.verifyEfoodUsers(decode);

        if (!verifyUser) {
          // REGISTER USERS
          await this.registerSsoUser(decode, loginSSO);
        }

        const efoodToken = await this.generateEfoodToken(verifyUser);

        return efoodToken;
      }
      return loginSSO;
    } catch (error) {
      console.log(error);
      return this.returningError(error);
    }
  }

  /**
   * Verify Users Is Exist in Efood Customer
   * @param loginSSO
   */
  async verifyEfoodUsers(decode) {
    try {
      if (decode) {
        const findUsers = this.customerRepo.createQueryBuilder();
        if (decode.id) {
          findUsers.where('sso_id = :sso_id', { sso_id: decode.id });
        }

        if (decode.email && decode.email != '') {
          findUsers.andWhere('email = :email', { email: decode.email });
        }

        if (decode.phone_number && decode.phone_number != '') {
          findUsers.andWhere('phone = :phone', {
            phone: `62${decode.phone_number}`,
          });
        }

        const userFound = await findUsers.getOne();
        return userFound;
      }
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async registerSsoUser(ssoDecoding, loginSSO) {
    // GET SSO USER DETAIL
    const find = {
      phone: '0' + ssoDecoding.phone_number,
    };

    const urlFind = 'api/user/get_user_detail_by_phone';
    // Request detail to sso account
    const ssoDetail = await this.httpSsoRequests(find, urlFind, {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + loginSSO.access_token,
    });

    if (ssoDetail && ssoDetail.data) {
      const sso_profil = ssoDetail.data;
      const currentDate = new Date();
      const custData: Partial<ProfileDocument> = {
        name: sso_profil.fullname,
        email: sso_profil.email,
        dob: sso_profil.date_of_birth.substring(0, 10),
        phone: '62' + sso_profil.phone_number,
        gender:
          sso_profil.gender && sso_profil.gender == 'Wanita'
            ? Gender.Female
            : Gender.Male,
        sso_id: sso_profil.id,
        photo: null,
        phone_verified_at: currentDate,
        email_verified_at: currentDate,
        is_active: true,
        allow_notification_promo: true,
      };
      await this.customerRepo.save(custData);

      // SAVE GENERATE OTP
      await this.httpAuthRequests(
        {
          phone: custData.phone,
          email: custData.email,
        },
        'api/v1/auth/otp-sso',
        {
          'Content-Type': 'application/json',
        },
      );
      return custData;
    }
    return ssoDetail;
  }

  /**
   * GENERATE EFOOD TOKEN
   * @param data
   * @returns
   */
  async generateEfoodToken(data) {
    // GENERATE EFOOD TOKEN
    const data_token = {
      id: data.id,
      user_type: 'customer',
      roles: ['customer'],
      level: null,
      group_id: null,
      merchant_id: null,
      store_id: null,
      created_at: data.created_at,
    };
    const loginEfood = await this.httpAuthRequests(
      data_token,
      'api/v1/auth/generate-token',
      { 'Content-Type': 'application/json' },
    );
    return loginEfood;
  }

  /**
   * DECODE SSO TOKEN
   * @param loginSSO
   * @returns
   */
  decodeSsoToken(loginSSO) {
    const jwtToken = loginSSO.access_token;
    const base64Payload = jwtToken.split('.')[1];
    const payloadBuffer: JwtPayload = Buffer.from(base64Payload, 'base64');
    const updatedJwtPayload = JSON.parse(
      payloadBuffer.toString(),
    ) as JwtPayload;
    return updatedJwtPayload;
  }

  /**
   * ERROR CALLBACK
   * @param constraint
   * @returns
   */
  returningError(constraint) {
    // IF SSO LOGIN FAILED RETURNING ERROR
    const errors: RMessage = {
      value: '',
      property: 'SSO AUTH API',
      constraint: constraint,
    };
    return this.responseService.error(
      HttpStatus.UNAUTHORIZED,
      errors,
      this.messageService.get('auth.token.forbidden'),
    );
  }

  /**
   * #################################################################################
   * AUTH SERVICE COMMUNICATION PROCESS
   * #################################################################################   *
   */

  /**
   * GENERAL HTTP AUTH REQUEST
   * @param payload
   * @param urlPath
   * @param headerRequest
   * @returns
   */
  async httpAuthRequests(payload: any, urlPath: string, headerRequest) {
    try {
      // AUTH URL
      const url = `${process.env.BASEURL_AUTH_SERVICE}/${urlPath}`;

      // SSO POST REQUEST
      const post_request = this.httpService
        .post(url, payload, { headers: headerRequest })
        .pipe(
          map((axiosResponse: AxiosResponse) => {
            return axiosResponse.data;
          }),
        );

      // GETTING RESPONSE FROM SSO
      const response = await lastValueFrom(post_request);
      return response;
    } catch (error) {
      console.log(error.response.data);
      return error.response.data;
    }
  }

  async httpSsoRequests(payload: any, urlPath: string, headerRequest) {
    try {
      // AUTH URL
      const url = `${process.env.SSO_HOST}/${urlPath}`;

      // SSO POST REQUEST
      const post_request = this.httpService
        .post(url, payload, { headers: headerRequest })
        .pipe(
          map((axiosResponse: AxiosResponse) => {
            return axiosResponse.data;
          }),
        );

      // GETTING RESPONSE FROM SSO
      const response = await lastValueFrom(post_request);
      return response;
    } catch (error) {
      console.log(error.response.data);
      return error.response.data;
    }
  }

  /**
   * ##################################################################################
   * GENERATE DEFAULT PASSWORD
   * ##################################################################################
   * @param password
   * @returns
   */
  generateHashPassword(password: string): Promise<string> {
    const defaultSalt: number =
      Number(process.env.HASH_PASSWORDSALTLENGTH) || 10;
    const salt = genSaltSync(defaultSalt);

    return hash(password, salt);
  }
}
