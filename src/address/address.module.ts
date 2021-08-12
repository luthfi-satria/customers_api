import { HttpModule, Module } from '@nestjs/common';
import { AddressService } from './address.service';
import { AddressController } from './address.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from 'src/database/entities/address.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Address]), HttpModule],
  controllers: [AddressController],
  providers: [AddressService],
})
export class AddressModule {}
