import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from '../../../shared/schemas/entities/address.entity';
import { CreateAddressDto } from '../dto/create-address.dto';
import { UpdateAddressDto } from '../dto/update-address.dto';

@Injectable()
export class AddressService {
    constructor(
        @InjectRepository(Address)
        private readonly addressRepository: Repository<Address>,
    ) {}

    async create(createAddressDto: CreateAddressDto): Promise<Address> {
        const address = this.addressRepository.create(createAddressDto);
        return await this.addressRepository.save(address);
    }

    async findAll(): Promise<Address[]> {
        return await this.addressRepository.find();
    }

    async findOne(id: string): Promise<Address> {
        const address = await this.addressRepository.findOne({ where: { id } });
        if (!address) {
            throw new NotFoundException(`Address with ID "${id}" not found`);
        }
        return address;
    }

    async update(id: string, updateAddressDto: UpdateAddressDto): Promise<Address> {
        const address = await this.findOne(id);
        this.addressRepository.merge(address, updateAddressDto);
        return await this.addressRepository.save(address);
    }

    async remove(id: string): Promise<void> {
        const address = await this.findOne(id);
        await this.addressRepository.remove(address);
    }
}