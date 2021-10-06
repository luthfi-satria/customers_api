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
  Req,
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
import { SetActiveAddressDto } from './dto/set-active-address.dto';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { AuthJwtGuard } from 'src/auth/auth.decorators';

@Controller('api/v1/customers/addresses')
export class AddressController {
  constructor(
    private readonly addressService: AddressService,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
  ) {}

  @Post()
  @UserType('customer')
  @AuthJwtGuard()
  async create(@Req() req: any, @Body() createAddressDto: CreateAddressDto) {
    createAddressDto.customer_id = req.user.id;
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
  @UserType('customer')
  @AuthJwtGuard()
  async findAll(@Req() req: any, @Query() request: SelectAddressDto) {
    request.id_profile = req.user.id;
    const address = await this.addressService.findAll(request);
    if (!address) {
      const errors: RMessage = {
        value: '',
        property: '',
        constraint: [this.messageService.get('address.select.fail')],
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

  @Get(':id')
  @UserType('customer')
  @AuthJwtGuard()
  async findOne(@Req() req: any, @Param('id') id: string) {
    const address = await this.addressService.findOne(id, req.user.id, [
      'customer',
    ]);
    if (!address) {
      const errors: RMessage = {
        value: id,
        property: 'id',
        constraint: [this.messageService.get('address.error.not_found')],
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
  @UserType('customer')
  @AuthJwtGuard()
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    updateAddressDto.customer_id = req.user.id;
    const address = await this.addressService.findOne(id, req.user.id, [
      'customer',
    ]);
    if (!address) {
      const errors: RMessage = {
        value: id,
        property: 'id',
        constraint: [this.messageService.get('address.error.not_found')],
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
  @UserType('customer')
  @AuthJwtGuard()
  async remove(@Req() req: any, @Param('id') id: string) {
    const address = await this.addressService.findOne(id, req.user.id, [
      'customer',
    ]);
    if (!address) {
      const errors: RMessage = {
        value: id,
        property: 'id',
        constraint: [this.messageService.get('address.error.not_found')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }

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
    );
  }

  @Put('set-active/:id')
  @UserType('customer')
  @AuthJwtGuard()
  async setActive(
    @Req() req: any,
    @Param('id') id: string,
    @Body() setActiveAddressDto: SetActiveAddressDto,
  ) {
    setActiveAddressDto.customer_id = req.user.id;
    setActiveAddressDto.id = id;
    const address = await this.addressService.findOne(id, req.user.id, [
      'customer',
    ]);
    if (!address) {
      const errors: RMessage = {
        value: id,
        property: 'id',
        constraint: [this.messageService.get('address.error.not_found')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }

    const update_address = await this.addressService.setActive(
      setActiveAddressDto,
    );
    if (!update_address) {
      const errors: RMessage = {
        value: '',
        property: '',
        constraint: [this.messageService.get('address.set_active.fail')],
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
      this.messageService.get('address.set_active.success'),
      update_address,
    );
  }
}
