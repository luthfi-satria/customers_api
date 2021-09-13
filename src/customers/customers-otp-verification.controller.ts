import { Body, Controller, Post, Req } from '@nestjs/common';

import { ResponseStatusCode } from 'src/response/response.decorator';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { OtpCreateValidation } from './validation/otp.create.validation';
import { OtpVerificationService } from './customers-otp-verification.service';

@Controller('api/v1/customers/profile')
export class OtpVerificationController {
  constructor(
    private readonly otpVerificationService: OtpVerificationService,
  ) {}

  @Post('verify-phone')
  @UserType('customer')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async verifyNewPhone(
    @Req() req: any,
    @Body()
    args: Partial<OtpCreateValidation>,
  ): Promise<any> {
    args.id = req.user.id;
    return await this.otpVerificationService.verifyNewPhone(args);
  }

  @Post('verify-phone-validation')
  @UserType('customer')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async validationNewPhone(
    @Req() req: any,
    @Body()
    args: Partial<OtpCreateValidation>,
  ): Promise<any> {
    args.id = req.user.id;
    return await this.otpVerificationService.validationNewPhone(args);
  }

  @Post('verify-email')
  @UserType('customer')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async verifyNewEmail(
    @Req() req: any,
    @Body()
    args: Partial<OtpCreateValidation>,
  ): Promise<any> {
    args.id = req.user.id;
    return await this.otpVerificationService.verifyNewEmail(args);
  }

  @Post('verify-email-validation')
  @UserType('customer')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async validationNewEmail(
    @Req() req: any,
    @Body()
    args: Partial<OtpCreateValidation>,
  ): Promise<any> {
    args.id = req.user.id;
    return await this.otpVerificationService.validationNewEmail(args);
  }
}
