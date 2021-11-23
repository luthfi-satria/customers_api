import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HashService } from 'src/hash/hash.service';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { CustomersModule } from '../customers/customers.module';
import { CustomersService } from '../customers/customers.service';
import { InternalController } from './internal.controller';
import { InternalService } from './internal.service';

@Module({
  imports: [CustomersModule],
  controllers: [InternalController],
  providers: [
    InternalService,
    CustomersService,
    ResponseService,
    MessageService,
    ConfigService,
    HashService,
  ],
})
export class InternalModule {}
