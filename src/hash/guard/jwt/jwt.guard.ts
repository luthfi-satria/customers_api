import { AuthGuard } from '@nestjs/passport';
import {
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ResponseService } from 'src/response/response.service';
import { Response } from 'src/response/response.decorator';
import { Message } from 'src/message/message.decorator';
import { MessageService } from 'src/message/message.service';
import { RMessage } from 'src/response/response.interface';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
  ) {
    super();
  }

  handleRequest<TUser = any>(
    err: Record<string, any>,
    user: TUser,
    // info: string,
  ): TUser {
    const logger = new Logger();

    if (err || !user) {
      logger.error('AuthJwtGuardError');
      const errors: RMessage = {
        value: '',
        property: 'token',
        constraint: [this.messageService.get('auth.profile.unauthorize')],
      };
      throw new UnauthorizedException(
        this.responseService.error(
          HttpStatus.UNAUTHORIZED,
          errors,
          'Unauthorize',
        ),
      );
    }

    return user;
  }
}
