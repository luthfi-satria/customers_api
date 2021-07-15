import {
  applyDecorators,
  Inject,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { ResponseFilter } from 'src/response/response.filter';
import { ResponseInterceptor } from 'src/response/response.interceptor';
import { IApplyDecorator } from './customers.interface';

export function ResponseStatusCode(): IApplyDecorator {
  return applyDecorators(
    UseInterceptors(ResponseInterceptor),
    UseFilters(ResponseFilter),
  );
}

export function Response(): (
  target: Record<string, any>,
  key: string | symbol | boolean,
  index?: number,
) => void {
  return Inject(`ResponseService`);
}

export function Message(): (
  target: Record<string, any>,
  key: string | symbol,
  index?: number,
) => void {
  return Inject(`MessageService`);
}
