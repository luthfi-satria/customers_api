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

@Module({
  imports: [TypeOrmModule.forFeature([Address, ProfileDocument]), CommonModule],
  controllers: [AddressController],
  providers: [AddressService, AuthService, CommonService, CustomersService],
})
export class AddressModule {}
