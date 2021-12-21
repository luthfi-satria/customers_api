import { Module } from '@nestjs/common';
import { AddressService } from './address.service';
import { AddressController } from './address.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from 'src/database/entities/address.entity';
import { AuthService } from 'src/utils/auth.service';
import { CommonModule } from 'src/common/common.module';
import { CommonService } from 'src/common/common.service';
import { CustomersService } from 'src/customers/customers.service';
import { ProfileDocument } from 'src/database/entities/profile.entity';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';
import { ConfigService } from '@nestjs/config';
import { HashService } from 'src/hash/hash.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([Address, ProfileDocument]),
    CommonModule,
    HttpModule,
  ],
  controllers: [AddressController],
  providers: [
    AddressService,
    AuthService,
    CommonService,
    CustomersService,
    ResponseService,
    MessageService,
    HashService,
    ConfigService,
    // HttpService,
  ],
  exports: [AddressService],
})
export class AddressModule {}
