import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { Response } from 'src/customers/customers.decorator';
import { HashService } from 'src/hash/hash.service';
import { Message } from 'src/message/message.decorator';
import { MessageService } from 'src/message/message.service';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly hashService: HashService,
    @Message() private readonly messageService: MessageService,
    @Response() private readonly responseService: ResponseService,
  ) {}

  async auth(token: string) {
    try {
      if (typeof token == 'undefined' || token == 'undefined') {
        throw new Error('Undefined Token');
      }

      const payload = await this.hashService.jwtPayload(
        token.replace('Bearer ', ''),
      );
      if (payload.user_type != 'customer') {
        throw new Error('Forbidden Access');
      }
      return payload;
    } catch (error) {
      console.log(error);
      const errors: RMessage = {
        value: '',
        property: 'token',
        constraint: [this.messageService.get('auth.token.invalid_token')],
      };
      throw new UnauthorizedException(
        this.responseService.error(
          HttpStatus.UNAUTHORIZED,
          errors,
          'Bad Request',
        ),
      );
    }
  }
}
