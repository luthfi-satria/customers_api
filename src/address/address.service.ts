import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Address } from 'src/database/entities/address.entity';
import { Repository } from 'typeorm';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address) private addressRepository: Repository<Address>,
  ) {}

  async create(createAddressDto: CreateAddressDto): Promise<Address> {
    const create_address = this.addressRepository.create(createAddressDto);
    return await this.addressRepository.save(create_address);
  }

  async findAll() {
    return await this.addressRepository.find();
  }

  async findOne(id: string) {
    return await this.addressRepository.findOne(id);
  }

  async update(id: string, updateAddressDto: UpdateAddressDto) {
    const update_address = await this.addressRepository.update(
      id,
      updateAddressDto,
    );
    return update_address;
  }

  async remove(id: string) {
    return await this.addressRepository.delete(id);
  }
}
