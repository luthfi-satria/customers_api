import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'src/customers/customers.decorator';
import { Address } from 'src/database/entities/address.entity';
import { HashService } from 'src/hash/hash.service';
import { Message } from 'src/message/message.decorator';
import { MessageService } from 'src/message/message.service';
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
    private readonly hashService: HashService,
  ) {}

  async create(createAddressDto: CreateAddressDto): Promise<Address> {
    const create_address = this.addressRepository.create(createAddressDto);

    if (createAddressDto.is_active == true) {
      const adresses = await this.addressRepository.find({
        where: { customer_id: create_address.customer_id },
      });
      const listAddressId: string[] = [];
      adresses.forEach(async (address) => {
        listAddressId.push(address.id);
      });
      const updateAddress: Partial<CreateAddressDto> = {
        is_active: false,
      };
      await this.addressRepository.update(listAddressId, updateAddress);
    }
    return await this.addressRepository.save(create_address);
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

  async findOne(id: string, customer_id?: string) {
    const where = { id };
    if (customer_id) {
      where['customer_id'] = customer_id;
    }
    return await this.addressRepository.findOne({
      relations: ['customer'],
      where,
    });
  }

  async update(id: string, updateAddressDto: UpdateAddressDto) {
    let update_address;
    if (updateAddressDto.is_active == true) {
      update_address = await this.addressRepository
        .query(
          "UPDATE customers_address SET is_active=true WHERE id = '" +
            id +
            "';UPDATE customers_address SET is_active = false WHERE id != '" +
            id +
            "' AND customer_id = '" +
            updateAddressDto.customer_id +
            "'",
        )
        .then(() => {
          return true;
        })
        .catch(() => {
          return false;
        });
      if (!update_address) {
        return false;
      }
    } else {
      delete updateAddressDto.is_active;
      update_address = await this.addressRepository.update(
        id,
        updateAddressDto,
      );
      console.log('update address', update_address);

      if (!update_address.affected) {
        return false;
      }
    }
    return await this.findOne(id);
  }

  async remove(id: string) {
    return await this.addressRepository.softDelete(id);
  }

  async restore(id: string) {
    return await this.addressRepository.restore(id);
  }

  async setActive(setActiveParam: SetActiveAddressDto) {
    const set_inactive = await this.addressRepository
      .createQueryBuilder()
      .update()
      .set({ is_active: false })
      .where({ customer_id: setActiveParam.customer_id })
      .execute();
    if (!set_inactive.affected) {
      return false;
    }
    const set_active = await this.addressRepository
      .createQueryBuilder()
      .update()
      .set({ is_active: true })
      .where({ id: setActiveParam.id })
      .execute();
    if (!set_active.affected) {
      return false;
    }
    return await this.findOne(setActiveParam.id);
  }
}
