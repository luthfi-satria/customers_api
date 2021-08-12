import { HttpModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseService } from './database/database.service';
import { MessageModule } from './message/message.module';
import { CustomersModule } from './customers/customers.module';
import { ResponseModule } from './response/response.module';
import { HashModule } from './hash/hash.module';
import { AddressModule } from './address/address.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseService,
    }),
    CustomersModule,
    MessageModule,
    ResponseModule,
    HashModule,
    HttpModule,
    AddressModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
