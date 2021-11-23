import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseService } from './database/database.service';
import { CustomersModule } from './customers/customers.module';
// import { HashModule } from './hash/hash.module';
import { AddressModule } from './address/address.module';
import { CommonModule } from './common/common.module';
import { InternalModule } from './internal/internal.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseService,
    }),
    CustomersModule,
    HttpModule,
    AddressModule,
    CommonModule,
    InternalModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
