import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileDocument } from 'src/database/entities/profile.entity';
import { Address } from 'src/database/entities/address.entity';
import { AddressModule } from 'src/address/address.module';
import { HttpModule } from '@nestjs/axios';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';
import { CustomerRepositoryDocument } from './repository/customer.repository';
import { CommonService } from 'src/common/common.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProfileDocument, Address]),
    AddressModule,
    HttpModule,
  ],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ResponseService,
    MessageService,
    CustomerRepositoryDocument,
    CommonService,
  ],
})
export class ReportsModule {}
