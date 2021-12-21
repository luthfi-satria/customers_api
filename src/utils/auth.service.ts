import { Injectable } from '@nestjs/common';
import { HashService } from 'src/hash/hash.service';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly hashService: HashService,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}

  // async auth(token: string) {
  //   try {
  //     if (typeof token == 'undefined' || token == 'undefined') {
  //       throw new Error('Undefined Token');
  //     }

  //     const payload = await this.hashService.jwtPayload(
  //       token.replace('Bearer ', ''),
  //     );
  //     if (payload.user_type != 'customer') {
  //       throw new Error('Forbidden Access');
  //     }
  //     return payload;
  //   } catch (error) {
  //     const errors: RMessage = {
  //       value: '',
  //       property: 'token',
  //       constraint: [this.messageService.get('auth.token.invalid_token')],
  //     };
  //     throw new UnauthorizedException(
  //       this.responseService.error(
  //         HttpStatus.UNAUTHORIZED,
  //         errors,
  //         'Bad Request',
  //       ),
  //     );
  //   }
  // }
}
