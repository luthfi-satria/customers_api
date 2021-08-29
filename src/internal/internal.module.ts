import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { CustomersService } from '../customers/customers.service';
import { InternalController } from './internal.controller';
import { InternalService } from './internal.service';

@Module({
  imports: [CustomersModule],
  controllers: [InternalController],
  providers: [InternalService, CustomersService],
})
export class InternalModule {}
