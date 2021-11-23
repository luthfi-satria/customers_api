import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { ProfileDocument } from 'src/database/entities/profile.entity';
import { AuthService } from 'src/utils/auth.service';
import { ImageValidationService } from 'src/utils/image-validation.service';
import { PhoneConstraintService } from './customers-phone-constraint.service';
import { PhoneConstraintController } from './customers-phone-constraint.controller';
import { CommonService } from 'src/common/common.service';
import { OtpVerificationService } from './customers-otp-verification.service';
import { OtpVerificationController } from './customers-otp-verification.controller';
import { EmailVerificationService } from './customers-email-verification.service';
import { EmailVerificationController } from './customers-email-verification.controller';
import { CustomersUserManagementController } from './customers-user-management.controller';
import { AddressModule } from 'src/address/address.module';
import { Address } from 'src/database/entities/address.entity';
import { CustomersUserManagementService } from './customers-user-management.service';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';
import { ConfigService } from '@nestjs/config';
import { HttpModule, HttpService } from '@nestjs/axios';
import { HashService } from 'src/hash/hash.service';
// import { HashModule } from 'src/hash/hash.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProfileDocument, Address]),
    AddressModule,
    HttpModule,
  ],
  exports: [CustomersService, TypeOrmModule, HttpModule],
  providers: [
    CustomersService,
    AuthService,
    ImageValidationService,
    PhoneConstraintService,
    CommonService,
    OtpVerificationService,
    EmailVerificationService,
    CustomersUserManagementService,
    ResponseService,
    MessageService,
    ConfigService,
    HashService,
    // HttpService,
  ],
  controllers: [
    CustomersUserManagementController,
    CustomersController,
    PhoneConstraintController,
    OtpVerificationController,
    EmailVerificationController,
  ],
})
export class CustomersModule {}
