import { Body, Controller, Put } from '@nestjs/common';

import { ResponseStatusCode } from 'src/response/response.decorator';
import { EmailVerificationService } from './customers-email-verification.service';
import { EmailVerificationEmailVerifyValidation } from './validation/email-verification.email-verify.validation';

@Controller('api/v1/customers/verifications')
export class EmailVerificationController {
  constructor(
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @Put('email')
  @ResponseStatusCode()
  async verificationNewEmail(
    @Body()
    args: EmailVerificationEmailVerifyValidation,
  ): Promise<any> {
    return await this.emailVerificationService.verifyNewEmail(args);
  }
}
