import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileDocument } from 'src/database/entities/profile.entity';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { CustomersSsoController } from './customers-sso.controller';
import { CustomersSsoService } from './customers-sso.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProfileDocument]), HttpModule],
  providers: [CustomersSsoService, MessageService, ResponseService],
  controllers: [CustomersSsoController],
})
export class CustomersSsoModule {}
