import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersController } from './customers.controller';
import { OtpDocument } from '../database/entities/otp.entity';
import { CustomersService } from './customers.service';
import { ProfileDocument } from 'src/database/entities/profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OtpDocument, ProfileDocument])],
  exports: [CustomersService],
  providers: [CustomersService],
  controllers: [CustomersController],
})
export class CustomersModule {}
