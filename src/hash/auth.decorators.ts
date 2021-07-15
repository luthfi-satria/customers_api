import {
  UseGuards,
  createParamDecorator,
  ExecutionContext,
  applyDecorators,
} from '@nestjs/common';
import { IApplyDecorator } from 'src/customers/customers.interface';
import { BasicGuard } from './guard/basic/basic.guard';
import { JwtGuard } from './guard/jwt/jwt.guard';

export function AuthJwtGuard(): IApplyDecorator {
  return applyDecorators(UseGuards(JwtGuard));
}

export function AuthBasicGuard(): IApplyDecorator {
  return applyDecorators(UseGuards(BasicGuard));
}

export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext): Record<string, any> => {
    const { user } = ctx.switchToHttp().getRequest();
    return data ? user[data] : user;
  },
);
