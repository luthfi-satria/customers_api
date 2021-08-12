import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'src/customers/customers.decorator';
import { Address } from 'src/database/entities/address.entity';
import { Message } from 'src/message/message.decorator';
import { MessageService } from 'src/message/message.service';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { Repository } from 'typeorm';
import { CreateAddressDto } from './dto/create-address.dto';
import { SelectAddressDto } from './dto/select-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address) private addressRepository: Repository<Address>,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
  ) {}

  auth(token: string) {
    if (typeof token == 'undefined' || token == 'undefined') {
      const errors: RMessage = {
        value: '',
        property: 'token',
        constraint: [
          this.messageService.get('merchant.createlob.invalid_token'),
        ],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.UNAUTHORIZED,
          errors,
          'Bad Request',
        ),
      );
    }
  }

  async create(createAddressDto: CreateAddressDto): Promise<Address> {
    const create_address = this.addressRepository.create(createAddressDto);
    return await this.addressRepository.save(create_address);
  }

  async findAll(paramDto: SelectAddressDto) {
    const address = this.addressRepository
      .createQueryBuilder()
      .where('name ilike :name', { name: `%${paramDto.search}%` });
    const skip = (+paramDto.page - 1) * +paramDto.limit;
    address.skip(skip);
    address.take(+paramDto.limit);

    const totalItems = await address.getCount();
    const list = await address.getRawMany();

    const list_result = {
      total_item: +totalItems,
      limit: Number(paramDto.limit),
      current_page: Number(paramDto.page),
      items: list,
    };
    return list_result;
  }

  async findOne(id: string) {
    return await this.addressRepository.findOne({
      where: {
        id,
      },
    });
  }

  async update(id: string, updateAddressDto: UpdateAddressDto) {
    const update_address = await this.addressRepository.update(
      id,
      updateAddressDto,
    );
    if (!update_address.affected) {
      return false;
    }
    return await this.findOne(id);
  }

  async remove(id: string) {
    return await this.addressRepository.delete(id);
  }
}
