import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { Message } from 'src/message/message.decorator';
import { MessageService } from 'src/message/message.service';
import { Response } from 'src/response/response.decorator';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Controller('api/v1/customers/address')
export class AddressController {
  constructor(
    private readonly addressService: AddressService,

    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
  ) {}

  @Post()
  async create(@Body() createAddressDto: CreateAddressDto) {
    const create_address = await this.addressService.create(createAddressDto);
    if (!create_address) {
      const errors: RMessage = {
        value: '',
        property: '',
        constraint: [this.messageService.get('address.create.fail')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    return this.responseService.success(
      true,
      this.messageService.get('merchant.creategroup.success'),
      create_address,
    );
  }

  @Get()
  findAll() {
    return this.addressService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.addressService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateAddressDto: UpdateAddressDto) {
    return this.addressService.update(id, updateAddressDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.addressService.remove(id);
  }
}
