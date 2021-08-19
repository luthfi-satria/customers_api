import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpService,
  HttpStatus,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Message } from 'src/message/message.decorator';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { CustomersService } from './customers.service';
import { HashService } from './../hash/hash.service';
import { RequestValidationPipe } from './validation/request-validation.pipe';
import { Response, ResponseStatusCode } from 'src/response/response.decorator';
import { RMessage } from 'src/response/response.interface';
import { OtpCreateValidation } from './validation/otp.create.validation';
import { catchError, map } from 'rxjs/operators';
import { OtpPhoneValidateValidation } from './validation/otp.phone-validate.validation';
import { CustomerProfileValidation } from './validation/customers.profile.validation';
import { ProfileDocument } from 'src/database/entities/profile.entity';
import { ReqUpdataProfile } from './customers.interface';
import { CustomerResetPasswordValidation } from './validation/customers.resetpass.validation';
import { CustomerLoginEmailValidation } from './validation/customers.loginemail.validation';
import { CustomerLoginPhoneValidation } from './validation/customers.loginphone.validation';
import { OtpEmailValidateValidation } from './validation/otp.email-validate.validation';
import { AuthService } from 'src/utils/auth.service';
import { CommonStorageService } from 'src/common/storage/storage.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { editFileName, imageFileFilter } from 'src/utils/general-utils';
import { diskStorage } from 'multer';
import { ImageValidationService } from 'src/utils/image-validation.service';

const defaultJsonHeader: Record<string, any> = {
  'Content-Type': 'application/json',
};

@Controller('api/v1/customers')
export class CustomersController {
  constructor(
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
    private readonly customerService: CustomersService,
    private readonly hashService: HashService,
    private readonly authService: AuthService,
    private httpService: HttpService,
    private readonly storage: CommonStorageService,
    private readonly imageValidationService: ImageValidationService,
  ) {}

  @Post('otp')
  @ResponseStatusCode()
  async createotp(
    @Body(RequestValidationPipe(OtpCreateValidation))
    data: OtpCreateValidation,
  ): Promise<any> {
    const url: string = process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/otp';
    data.user_type = 'customer';

    return (
      await this.customerService.postHttp(url, data, defaultJsonHeader)
    ).pipe(
      map(async (response) => {
        const rsp: Record<string, any> = response;

        if (rsp.statusCode) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              rsp.message[0],
              'Bad Request',
            ),
          );
        }
        return response;
      }),
      catchError((err) => {
        throw err.response.data;
      }),
    );
  }

  @Post('otp-forget-password')
  @ResponseStatusCode()
  async createotpforgetpassword(
    @Body(RequestValidationPipe(OtpCreateValidation))
    data: OtpCreateValidation,
  ): Promise<any> {
    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/otp-forget-password';
    data.user_type = 'customer';

    return (
      await this.customerService.postHttp(url, data, defaultJsonHeader)
    ).pipe(
      map(async (response) => {
        const rsp: Record<string, any> = response;

        if (rsp.statusCode) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              rsp.message[0],
              'Bad Request',
            ),
          );
        }
        return response;
      }),
      catchError((err) => {
        throw err.response.data;
      }),
    );
  }

  @Post('otp-validation')
  @ResponseStatusCode()
  async validateeotp(
    @Body(RequestValidationPipe(OtpPhoneValidateValidation))
    data: OtpPhoneValidateValidation,
  ): Promise<any> {
    const create_profile = await this.customerService.createCustomerProfileOTP(
      data,
    );
    if (!create_profile) {
      const errors: RMessage = {
        value: '',
        property: 'otp_code',
        constraint: [this.messageService.get('customers.validate.fail')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    data.id = create_profile.id_profile;
    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/otp-validation';
    data.user_type = 'customer';
    data.roles = ['customer'];

    return (
      await this.customerService.postHttp(url, data, defaultJsonHeader)
    ).pipe(
      map(async (response) => {
        const rsp: Record<string, any> = response;

        if (rsp.statusCode) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              rsp.message[0],
              'Bad Request',
            ),
          );
        }
        return response;
      }),
      catchError((err) => {
        throw err.response.data;
      }),
    );
  }

  @Put('profile')
  @ResponseStatusCode()
  async profile(
    @Body()
    data: CustomerProfileValidation,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    if (typeof token == 'undefined' || token == 'undefined') {
      const errors: RMessage = {
        value: '',
        property: 'token',
        constraint: [this.messageService.get('auth.token.invalid_token')],
      };
      throw new UnauthorizedException(
        this.responseService.error(
          HttpStatus.UNAUTHORIZED,
          errors,
          'UNAUTHORIZED',
        ),
      );
    }

    const payload = await this.hashService.jwtPayload(
      token.replace('Bearer ', ''),
    );
    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/profile';
    const headersRequest: Record<string, any> = {
      'Content-Type': 'application/json',
      Authorization: token,
    };
    data.user_type = 'customer';
    data.roles = ['customer'];
    return (await this.customerService.putHttp(url, data, headersRequest)).pipe(
      map(async (response) => {
        const rsp: Record<string, any> = response;
        if (!rsp.success) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              rsp.message[0],
              'Bad Request',
            ),
          );
        }

        const cekemail: ProfileDocument =
          await this.customerService.findOneCustomerByEmailExceptId(
            data.email,
            payload.id,
          );

        if (cekemail) {
          const errors: RMessage = {
            value: data.email,
            property: 'email',
            constraint: [
              this.messageService.get('customers.profile.existemail'),
            ],
          };
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              errors,
              'Bad Request',
            ),
          );
        }

        const cekbyid: ProfileDocument =
          await this.customerService.findOneCustomerById(
            response.data.payload.id,
          );
        if (!cekbyid) {
          const errors: RMessage = {
            value: token.replace('Bearer ', ''),
            property: 'token',
            constraint: [this.messageService.get('customers.profile.invalid')],
          };
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              errors,
              'Bad Request',
            ),
          );
        }

        try {
          const profiledata: ReqUpdataProfile = {
            id_profile: response.data.payload.id,
            phone: cekbyid.phone,
            name: data.name,
            email: data.email,
            dob: data.dob ?? null,
          };
          await this.customerService.createCustomerProfile(profiledata, true);
          delete response.data.payload;
          return this.responseService.success(
            true,
            this.messageService.get('customers.profile.success'),
            response.data,
          );
        } catch (err: any) {
          const errors: RMessage = {
            value: '',
            property: '',
            constraint: [this.messageService.get('customers.profile.invalid')],
          };
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              errors,
              'Bad Request',
            ),
          );
        }
      }),
      catchError((err) => {
        throw err.response.data;
      }),
    );
  }

  @Get('profile')
  @ResponseStatusCode()
  async getProfile(@Headers('Authorization') token: string): Promise<any> {
    const payload = await this.authService.auth(token);
    const profile = await this.customerService.findOneWithActiveAddresses(
      payload.id,
    );
    if (!profile) {
      const errors: RMessage = {
        value: payload.id,
        property: 'token_payload.id',
        constraint: [this.messageService.get('customers.error.not_found')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    return this.responseService.success(
      true,
      this.messageService.get('customers.select.success'),
      profile,
    );
  }

  @Put('profile-picture')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: './upload_customers',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async updateProfilePicture(
    @Req() request,
    @UploadedFile() file: Express.Multer.File,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    await this.imageValidationService.validateAll(request, ['required']);

    const payload = await this.authService.auth(token);
    const path_photo = '/upload_customers/' + file.filename;
    const photo_url = await this.storage.store(path_photo);
    const profile: ProfileDocument =
      await this.customerService.findOneCustomerById(payload.id);
    profile.photo = photo_url;
    try {
      await this.customerService.updateCustomerProfile(profile);
      return this.responseService.success(
        true,
        this.messageService.get('customers.profile.success'),
        profile,
      );
    } catch (err) {
      const errors = {
        value: '',
        property: '',
        constraint: [this.messageService.get('customers.profile.fail')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
  }

  @Post('login/phone')
  @ResponseStatusCode()
  async loginByPhone(
    @Body(RequestValidationPipe(CustomerLoginPhoneValidation))
    data: CustomerLoginPhoneValidation,
  ): Promise<any> {
    const existcust = await this.customerService.findOneCustomerByPhone(
      data.phone,
    );

    if (!existcust) {
      const errors: RMessage = {
        value: data.phone,
        property: 'phone',
        constraint: [
          this.messageService.get('customers.login.unregistered_phone'),
        ],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }

    const data_otp = new OtpCreateValidation();
    data_otp.phone = data.phone;
    data_otp.user_type = 'login';

    const url_otp: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/otp-login-phone';
    return (
      await this.customerService.postHttp(url_otp, data_otp, defaultJsonHeader)
    ).pipe(
      map(async (response) => {
        const rsp: Record<string, any> = response;

        if (rsp.statusCode) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              rsp.message[0],
              'Bad Request',
            ),
          );
        }
        return response;
      }),
      catchError((err) => {
        throw err.response.data;
      }),
    );
  }

  @Post('login/phone-otp-validation')
  @ResponseStatusCode()
  async validatePhoneOtpValidation(
    @Body(RequestValidationPipe(OtpPhoneValidateValidation))
    data: OtpPhoneValidateValidation,
  ): Promise<any> {
    const customer = await this.customerService.findOneCustomerByPhone(
      data.phone,
    );
    if (!customer) {
      const errors: RMessage = {
        value: data.phone,
        property: 'phone',
        constraint: [
          this.messageService.get('customers.login.unregistered_phone'),
        ],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    data.id = customer.id_profile;
    const url: string =
      process.env.BASEURL_AUTH_SERVICE +
      '/api/v1/auth/otp-login-phone-validation';
    data.user_type = 'customer';
    data.roles = ['customer'];
    return (
      await this.customerService.postHttp(url, data, defaultJsonHeader)
    ).pipe(
      map(async (response) => {
        const rsp: Record<string, any> = response;

        if (rsp.statusCode) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              rsp.message[0],
              'Bad Request',
            ),
          );
        }
        return response;
      }),
      catchError((err) => {
        throw err.response.data;
      }),
    );
  }

  @Post('login/email')
  @ResponseStatusCode()
  async loginByEmail(
    @Body(RequestValidationPipe(CustomerLoginEmailValidation))
    data: CustomerLoginEmailValidation,
  ): Promise<any> {
    const existcust = await this.customerService.findOneCustomerByEmail(
      data.email,
    );

    if (!existcust) {
      const errors: RMessage = {
        value: data.email,
        property: 'email',
        constraint: [
          this.messageService.get('customers.login.unregistered_email'),
        ],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }

    const data_otp = new OtpEmailValidateValidation();
    data_otp.email = data.email;
    data_otp.user_type = 'login';

    const url_otp: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/otp-login-email';
    return (
      await this.customerService.postHttp(url_otp, data_otp, defaultJsonHeader)
    ).pipe(
      map(async (response) => {
        const rsp: Record<string, any> = response;

        if (rsp.statusCode) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              rsp.message[0],
              'Bad Request',
            ),
          );
        }
        return response;
      }),
      catchError((err) => {
        throw err.response.data;
      }),
    );
  }

  @Post('login/email-otp-validation')
  @ResponseStatusCode()
  async validateEmailOtpValidation(
    @Body()
    data: OtpEmailValidateValidation,
  ): Promise<any> {
    const customer = await this.customerService.findOneCustomerByEmail(
      data.email,
    );

    if (!customer) {
      const errors: RMessage = {
        value: data.email,
        property: 'email',
        constraint: [
          this.messageService.get('customers.login.unregistered_email'),
        ],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    data.id = customer.id_profile;
    const url: string =
      process.env.BASEURL_AUTH_SERVICE +
      '/api/v1/auth/otp-login-email-validation';
    data.user_type = 'customer';
    data.roles = ['customer'];

    return (
      await this.customerService.postHttp(url, data, defaultJsonHeader)
    ).pipe(
      map(async (response) => {
        const rsp: Record<string, any> = response;

        if (rsp.statusCode) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              rsp.message[0],
              'Bad Request',
            ),
          );
        }
        return response;
      }),
      catchError((err) => {
        throw err.response.data;
      }),
    );
  }

  @Post('refresh-token')
  async refreshToken(@Headers('Authorization') token: string): Promise<any> {
    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/refresh-token';
    const headersRequest: Record<string, any> = {
      'Content-Type': 'application/json',
      Authorization: token,
      'request-from': 'customer',
    };
    const http_req: Record<string, any> = {
      user_type: 'customer',
      roles: ['customer'],
    };

    return (
      await this.customerService.postHttp(url, http_req, headersRequest)
    ).pipe(
      map(async (response) => {
        const rsp: Record<string, any> = response;

        if (rsp.statusCode) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              rsp.message[0],
              'Bad Request',
            ),
          );
        }
        return this.responseService.success(
          true,
          this.messageService.get('customers.refresh_token.success'),
          response.data,
        );
      }),
      catchError((err) => {
        return err.response.data;
        // return throwError(err);
        // return this.responseService.error(
        //   // err.response.data.c,
        //   HttpStatus.BAD_REQUEST,
        //   err.response.data.message,
        //   'Bad Request',
        // );
      }),
    );
  }

  @Put('reset-password')
  @ResponseStatusCode()
  async resetPassword(
    @Body(RequestValidationPipe(CustomerResetPasswordValidation))
    data: CustomerResetPasswordValidation,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/reset-password';
    const headersRequest: Record<string, any> = {
      'Content-Type': 'application/json',
      Authorization: token,
    };
    const http_req: Record<string, any> = {
      user_type: 'customer',
    };

    return (
      await this.customerService.putHttp(url, http_req, headersRequest)
    ).pipe(
      map(async (response) => {
        const rsp: Record<string, any> = response;

        if (rsp.statusCode) {
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              rsp.message[0],
              'Bad Request',
            ),
          );
        }

        const salt = await this.customerService.randomSalt();
        const passwordHash = await this.customerService.hashPassword(
          data.password,
          salt,
        );
        data.password = passwordHash;
        const profile: ProfileDocument =
          await this.customerService.findOneCustomerById(
            response.data.payload.id,
          );

        if (!profile) {
          const errors = {
            value: '',
            property: 'token',
            constraint: [this.messageService.get('auth.token.invalid_token')],
          };
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              errors,
              'Bad Request',
            ),
          );
        }

        // profile.password = passwordHash;

        try {
          await this.customerService.updateCustomerProfile(profile);
          return this.responseService.success(
            true,
            this.messageService.get('customers.reset_password.success'),
          );
        } catch (err) {
          const errors = {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('customers.reset_password.fail'),
            ],
          };
          throw new BadRequestException(
            this.responseService.error(
              HttpStatus.BAD_REQUEST,
              errors,
              'Bad Request',
            ),
          );
        }
      }),
      catchError((err) => {
        throw err.response.data;
      }),
    );
  }
}
