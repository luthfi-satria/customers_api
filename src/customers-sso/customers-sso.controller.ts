import { Controller, Post, Body, Logger } from '@nestjs/common';
import { RequestValidationPipe } from 'src/customers/validation/request-validation.pipe';
import { MessageService } from 'src/message/message.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { ResponseService } from 'src/response/response.service';
import { CustomersSsoService } from './customers-sso.service';
import { CustomerLoginSsoValidation } from './validation/customers.sso.validation';

@Controller('api/v1/customer/sso')
export class CustomersSsoController {
  constructor(
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private readonly ssoCustService: CustomersSsoService,
  ) {}

  logger = new Logger();

  @Post('auth')
  @ResponseStatusCode()
  async loginSso(
    @Body(RequestValidationPipe(CustomerLoginSsoValidation))
    data: CustomerLoginSsoValidation,
  ): Promise<any> {
    return this.ssoCustService.loginSso(data);
  }
}
