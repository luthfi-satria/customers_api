import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommonService } from 'src/common/common.service';
import { Response } from 'src/customers/customers.decorator';
import { Address } from 'src/database/entities/address.entity';
import { Message } from 'src/message/message.decorator';
import { MessageService } from 'src/message/message.service';
import { RMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { Repository } from 'typeorm';
import { CreateAddressDto } from './dto/create-address.dto';
import { SelectAddressDto } from './dto/select-address.dto';
import { SetActiveAddressDto } from './dto/set-active-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address) private addressRepository: Repository<Address>,
    @Response() private readonly responseService: ResponseService,
    @Message() private readonly messageService: MessageService,
    private readonly commonService: CommonService,
  ) {}

  async create(createAddressDto: CreateAddressDto) {
    createAddressDto.city_id = await this.getCityId(
      createAddressDto.postal_code,
    );
    const create_address = this.addressRepository.create(createAddressDto);
    try {
      const create = await this.addressRepository.save(create_address);
      if (createAddressDto.is_active == true) {
        const setActiveParam: SetActiveAddressDto = {
          customer_id: create.customer_id,
          id: create.id,
          is_active: true,
        };
        return await this.setActive(setActiveParam);
      }
    } catch (error) {
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
  }

  async findAll(paramDto: SelectAddressDto) {
    const address = this.addressRepository
      .createQueryBuilder('customers_address')
      .leftJoinAndSelect('customers_address.customer', 'customers_profile');
    if (paramDto.id_profile) {
      address.andWhere('customers_address.customer = :id_profile', {
        id_profile: paramDto.id_profile,
      });
    }
    if (paramDto.search) {
      address.andWhere('customers_address.name ilike :name', {
        name: `%${paramDto.search}%`,
      });
    }
    const skip = (+paramDto.page - 1) * +paramDto.limit;
    address.skip(skip);
    address.take(+paramDto.limit);

    const totalItems = await address.getCount();
    const list = await address.getMany();

    const list_result = {
      total_item: +totalItems,
      limit: Number(paramDto.limit),
      current_page: Number(paramDto.page),
      items: list,
    };
    return list_result;
  }

  async findOne(id: string, customer_id?: string, relations?: string[]) {
    const where = { id };
    if (customer_id) {
      where['customer_id'] = customer_id;
    }
    return this.addressRepository.findOne({
      relations: relations,
      where,
    });
  }

  async findAddressByIds(address_ids: string[]): Promise<Address[]> {
    return this.addressRepository.findByIds(address_ids);
  }

  async findAddressByIdsWithCustomerId(
    address_ids: any[],
    customer_id: string,
  ): Promise<Address[]> {
    return this.addressRepository.findByIds(address_ids, {
      where: { customer_id: customer_id },
    });
  }

  async update(id: string, updateAddressDto: UpdateAddressDto | Address) {
    updateAddressDto.city_id = await this.getCityId(
      updateAddressDto.postal_code,
    );
    try {
      const update_address = await this.addressRepository.update(
        id,
        updateAddressDto,
      );
      if (!update_address) {
        return false;
      }
      const address = await this.findOne(id);
      if (updateAddressDto.is_active == true) {
        const setActiveParam: SetActiveAddressDto = {
          customer_id: address.customer_id,
          id: address.id,
          is_active: true,
        };
        await this.setActive(setActiveParam);
      }
      return address;
    } catch (error) {
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
  }

  async updateByEntity(id: string, address: Address): Promise<Address> {
    return this.addressRepository.update(id, address).then(async (res) => {
      if (res.affected == 0) {
        Logger.log(
          `WARN Update Address success, but doenst affect anything!`,
          'Update Group Module',
        );
      }
      return this.addressRepository.findOne(id);
    });
  }

  async remove(id: string) {
    return await this.addressRepository.softDelete(id);
  }

  async restore(id: string) {
    return await this.addressRepository.restore(id);
  }

  async setActive(setActiveParam: SetActiveAddressDto): Promise<Address> {
    const set_inactive = await this.addressRepository
      .createQueryBuilder()
      .update()
      .set({ is_active: false })
      .where({ customer_id: setActiveParam.customer_id })
      .execute();
    if (!set_inactive.affected) {
      return null;
    }
    const set_active = await this.addressRepository
      .createQueryBuilder()
      .update()
      .set({ is_active: true })
      .where({ id: setActiveParam.id })
      .execute();
    if (!set_active.affected) {
      return null;
    }
    return await this.findOne(setActiveParam.id);
  }

  async getCityId(postal_code: string) {
    if (!postal_code) {
      return null;
    }
    const url: string =
      process.env.BASEURL_ADMINS_SERVICE +
      '/api/v1/admins/internal/postal-code/' +
      postal_code;
    const response_postal_code = await this.commonService.postHttp(url);
    if (!response_postal_code) {
      const errors: RMessage = {
        value: postal_code,
        property: 'postal_code',
        constraint: [this.messageService.get('address.postal_code.not_found')],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    return response_postal_code.data.city_id;
  }
}
