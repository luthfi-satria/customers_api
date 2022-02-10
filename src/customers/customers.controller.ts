import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { catchError, map } from 'rxjs/operators';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { CommonStorageService } from 'src/common/storage/storage.service';
import { ProfileDocument } from 'src/database/entities/profile.entity';
import { MessageService } from 'src/message/message.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { RMessage, RSuccessMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { editFileName, imageFileFilter } from 'src/utils/general-utils';
import { ImageValidationService } from 'src/utils/image-validation.service';
import { ReqUpdataProfile } from './customers.interface';
import { CustomersService } from './customers.service';
import { AdminCustomerProfileValidation } from './validation/admin.customers.profile.validation';
import { CustomerChangeEmailValidation } from './validation/customers.change-email.validation';
import { CustomerLoginEmailValidation } from './validation/customers.loginemail.validation';
import { CustomerLoginPhoneValidation } from './validation/customers.loginphone.validation';
import { CustomerProfileValidation } from './validation/customers.profile.validation';
import { CustomerResetPasswordValidation } from './validation/customers.resetpass.validation';
import { OtpCreateValidation } from './validation/otp.create.validation';
import { OtpEmailValidateValidation } from './validation/otp.email-validate.validation';
import { OtpPhoneValidateValidation } from './validation/otp.phone-validate.validation';
import { RequestValidationPipe } from './validation/request-validation.pipe';

const defaultJsonHeader: Record<string, any> = {
  'Content-Type': 'application/json',
};

@Controller('api/v1/customers')
export class CustomersController {
  constructor(
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private readonly customerService: CustomersService,
    private readonly storage: CommonStorageService,
    private readonly imageValidationService: ImageValidationService,
  ) {}

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

    if (existcust.is_active === false) {
      const errors: RMessage = {
        value: data.phone,
        property: 'phone',
        constraint: [
          this.messageService.get(
            'customers.login.customer_account_was_inactive',
          ),
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
    data.id = customer.id;
    const url: string =
      process.env.BASEURL_AUTH_SERVICE +
      '/api/v1/auth/otp-login-phone-validation';
    data.user_type = 'customer';
    data.roles = ['customer'];
    data.created_at = customer.created_at;
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

    if (!existcust.email_verified_at) {
      const errors: RMessage = {
        value: existcust.email_verified_at
          ? existcust.email_verified_at.toDateString()
          : null,
        property: 'email_verified_at',
        constraint: [
          this.messageService.get('customers.login.unverified_email'),
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

    if (existcust.is_active === false) {
      const errors: RMessage = {
        value: data.email,
        property: 'email',
        constraint: [
          this.messageService.get(
            'customers.login.customer_account_was_inactive',
          ),
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

    if (!customer.email_verified_at) {
      const errors: RMessage = {
        value: customer.email_verified_at
          ? customer.email_verified_at.toDateString()
          : null,
        property: 'email_verified_at',
        constraint: [
          this.messageService.get('customers.login.unverified_email'),
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

    data.id = customer.id;
    const url: string =
      process.env.BASEURL_AUTH_SERVICE +
      '/api/v1/auth/otp-login-email-validation';
    data.user_type = 'customer';
    data.roles = ['customer'];
    data.created_at = customer.created_at;

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
    data.user_type = 'forget-password';

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

  @Post('otp')
  @ResponseStatusCode()
  async createotp(
    @Body(RequestValidationPipe(OtpCreateValidation))
    data: OtpCreateValidation,
  ): Promise<any> {
    const existcustWithPhone =
      await this.customerService.findOneCustomerByPhone(data.phone);

    if (existcustWithPhone) {
      const errors: RMessage = {
        value: data.phone,
        property: 'phone',
        constraint: [this.messageService.get('customers.error.already_exist')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }

    const url: string = process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/otp';
    data.user_type = 'registration';

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
    data.id = create_profile.id;
    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/otp-validation';
    data.user_type = 'customer';
    data.roles = ['customer'];
    data.created_at = create_profile.created_at;

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
  @UserType('customer')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async profile(
    @Req() req: any,
    @Body()
    data: CustomerProfileValidation,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    // const payload = await this.hashService.jwtPayload(
    //   token.replace('Bearer ', ''),
    // );
    const customer = await this.customerService.findOneCustomerById(
      req.user.id,
    );
    if (!customer) {
      const errors: RMessage = {
        value: req.user.id,
        property: 'customer_id',
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

    const url: string =
      process.env.BASEURL_AUTH_SERVICE + '/api/v1/auth/profile';
    const headersRequest: Record<string, any> = {
      'Content-Type': 'application/json',
      Authorization: token,
    };
    data.user_type = 'customer';
    data.roles = ['customer'];
    data.created_at = customer.created_at;
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
            req.user.id,
          );

        if (cekemail) {
          const errors: RMessage = {
            value: data.email,
            property: 'email',
            constraint: [
              this.messageService.get('customers.profile.exist_email'),
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
          await this.customerService.findOneCustomerById(req.user.id);
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
        let phone = '';
        let flagPhone = false;
        if (data.phone) {
          const cekphone: ProfileDocument =
            await this.customerService.findOneCustomerByPhone(data.phone);

          if (cekphone && cekphone.id != req.user.id) {
            const errors: RMessage = {
              value: data.phone,
              property: 'phone',
              constraint: [this.messageService.get('customers.create.exist')],
            };
            throw new BadRequestException(
              this.responseService.error(
                HttpStatus.BAD_REQUEST,
                errors,
                'Bad Request',
              ),
            );
          }
          phone = data.phone;
          flagPhone = true;
        } else {
          phone = cekbyid.phone;
        }

        try {
          const profiledata: ReqUpdataProfile = {
            id: req.user.id, // response.data.payload.id,
            phone: phone,
            name: data.name,
            email: data.email,
            dob: data.dob ?? null,
            gender: data.gender ?? null,
            phone_verified_at: flagPhone
              ? new Date()
              : cekbyid.phone_verified_at,
          };
          data.id = cekbyid.id;
          const updatedProfile =
            await this.customerService.createCustomerProfile(profiledata, true);
          delete response.data.payload;

          if (!updatedProfile.email_verified_at) {
            this.customerService.sendVerificationEmail(updatedProfile);
          }

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
  @UserType('customer')
  // @Permission('customer_profile.view')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async getProfile(@Req() req: any): Promise<any> {
    const profile = await this.customerService.findOneWithActiveAddresses(
      req.user.id,
    );
    if (!profile) {
      const errors: RMessage = {
        value: req.user.id,
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
  @UserType('customer')
  @AuthJwtGuard()
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: './upload_customers',
        filename: editFileName,
      }),
      limits: {
        fileSize: 2000000, //2MB
      },
      fileFilter: imageFileFilter,
    }),
  )
  async updateProfilePicture(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    await this.imageValidationService.validateAll(req, ['required']);

    const path_photo = '/upload_customers/' + file.filename;
    const photo_url = await this.storage.store(path_photo);
    const profile: ProfileDocument =
      await this.customerService.findOneCustomerById(req.user.id);
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

  @Post('refresh-token')
  @UserType('customer')
  @AuthJwtGuard()
  async refreshToken(
    @Headers('Authorization') token: string,
    @Req() req: any,
  ): Promise<any> {
    const user = req.user;
    const customer: ProfileDocument = await this.customerService.findOne(
      user.id,
    );

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
      created_at: customer.created_at,
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
  @AuthJwtGuard()
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

  @Put('user-management/:id_profile')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async userManagement(
    @Param('id_profile') id_profile: string,
    @Body()
    body: AdminCustomerProfileValidation,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    return await this.customerService.updateCustomerManageProfile(
      token,
      id_profile,
      body,
    );
  }

  @Post('verifications/email')
  @UserType('customer')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async changeEmail(
    @Req() req: any,
    @Body()
    body: CustomerChangeEmailValidation,
    @Headers('Authorization') token: string,
  ): Promise<any> {
    return await this.customerService.changeEmail(body, req.user, token);
  }

  @Get('user-management/:user_id')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async detailUserCustomer(
    @Param('user_id') user_id: string,
  ): Promise<RSuccessMessage> {
    const profile = await this.customerService.findOne(user_id);
    return this.responseService.success(
      true,
      this.messageService.get('customers.select.success'),
      profile,
    );
  }
}
