import { HttpModule, Module } from '@nestjs/common';
import { AddressService } from './address.service';
import { AddressController } from './address.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from 'src/database/entities/address.entity';
import { AuthService } from 'src/utils/auth.service';

@Module({
  imports: [TypeOrmModule.forFeature([Address]), HttpModule],
  controllers: [AddressController],
  providers: [AddressService, AuthService],
})
export class AddressModule {}
