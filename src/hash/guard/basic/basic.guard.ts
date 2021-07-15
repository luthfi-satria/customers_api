import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { Response } from 'src/response/response.decorator';
// import { IResponse } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
// import { Loggerdec } from 'src/logger/logger.decorator';
import { ConfigService } from '@nestjs/config';
import { Message } from 'src/message/message.decorator';
import { MessageService } from 'src/message/message.service';
// import { AuthService } from 'src/auth/auth.service';
import { RMessage } from 'src/response/response.interface';
import { CustomersService } from 'src/customers/customers.service';

@Injectable()
export class BasicGuard implements CanActivate {
  constructor(
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
    private readonly configService: ConfigService,
    private readonly authService: CustomersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Env Variable
    const basicClientId: string = process.env.AUTH_BASICCLIENTID;
    const basicClientSecret: string = process.env.AUTH_BASICCLIENTSECRET;
    const request: Request = context.switchToHttp().getRequest();
    const authorization: string = request.headers.authorization;
    const logger = new Logger();

    if (!authorization) {
      logger.error('Unauthorize Request', 'AuthBasicGuardError');
      const errors: RMessage = {
        value: '',
        property: 'BasicGuard',
        constraint: [this.messageService.get('customers.profile.unauthorize')],
      };
      throw new UnauthorizedException(
        this.responseService.error(
          HttpStatus.UNAUTHORIZED,
          errors,
          'Unauthorize',
        ),
      );
    }

    const clientBasicToken: string = authorization.replace('Basic ', '');
    const ourBasicToken: string = await this.authService.createBasicToken(
      basicClientId,
      basicClientSecret,
    );

    const validateBasicToken: boolean =
      await this.authService.validateBasicToken(
        clientBasicToken,
        ourBasicToken,
      );

    if (!validateBasicToken) {
      logger.error(
        'AuthBasicGuardError Validate Basic Token',
        'AuthBasicGuardError',
      );

      const errors: RMessage = {
        value: '',
        property: 'BasicGuard',
        constraint: [this.messageService.get('customers.profile.unauthorize')],
      };
      throw new UnauthorizedException(
        this.responseService.error(
          HttpStatus.UNAUTHORIZED,
          errors,
          'Unauthorize',
        ),
      );
    }

    return true;
  }
}
