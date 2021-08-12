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
  Query,
} from '@nestjs/common';
import { Message } from 'src/message/message.decorator';
import { MessageService } from 'src/message/message.service';
import { Response } from 'src/response/response.decorator';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { SelectAddressDto } from './dto/select-address.dto';

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
      this.messageService.get('address.create.success'),
      create_address,
    );
  }

  @Get()
  findAll(@Query() request: SelectAddressDto) {
    const address = this.addressService.findAll(request);
    return address;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const address = await this.addressService.findOne(id);
    if (!address) {
      const errors: RMessage = {
        value: id,
        property: 'id',
        constraint: [this.messageService.get('address.select.not_found')],
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
      this.messageService.get('address.select.success'),
      address,
    );
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    const address = await this.addressService.findOne(id);
    if (!address) {
      const errors: RMessage = {
        value: id,
        property: 'id',
        constraint: [this.messageService.get('address.select.not_found')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }

    const update_address = await this.addressService.update(
      id,
      updateAddressDto,
    );
    if (!update_address) {
      const errors: RMessage = {
        value: '',
        property: '',
        constraint: [this.messageService.get('address.update.fail')],
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
      this.messageService.get('address.update.success'),
      update_address,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const delete_address = await this.addressService.remove(id);
    if (!delete_address) {
      const errors: RMessage = {
        value: '',
        property: '',
        constraint: [this.messageService.get('address.delete.fail')],
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
      this.messageService.get('address.delete.success'),
      delete_address,
    );
  }
}
