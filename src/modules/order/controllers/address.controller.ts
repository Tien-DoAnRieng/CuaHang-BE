import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiBody, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { AddressService } from '../services/address.service';
import { CreateAddressDto } from '../dto/create-address.dto';
import { UpdateAddressDto } from '../dto/update-address.dto';
import { Address } from '../../../shared/schemas/entities/address.entity';

@ApiTags('addresses')
@Controller('addresses')
export class AddressController {
    constructor(private readonly addressService: AddressService) {}

    @Post()
    @ApiOperation({ summary: 'Create address' })
    @ApiBody({ type: CreateAddressDto })
    @ApiResponse({ status: 201, description: 'Address created', type: Address })
    create(@Body() createAddressDto: CreateAddressDto) {
        return this.addressService.create(createAddressDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all addresses' })
    @ApiResponse({ status: 200, description: 'List of addresses', type: [Address] })
    findAll() {
        return this.addressService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get address by ID' })
    @ApiResponse({ status: 200, description: 'Get address by ID', type: Address })
    findOne(@Param('id') id: string) {
        return this.addressService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update address' })
    @ApiBody({ type: UpdateAddressDto })
    @ApiResponse({ status: 200, description: 'Address updated', type: Address })
    update(@Param('id') id: string, @Body() updateAddressDto: UpdateAddressDto) {
        return this.addressService.update(id, updateAddressDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete address' })
    @ApiResponse({ status: 204, description: 'Address deleted' })
    remove(@Param('id') id: string) {
        return this.addressService.remove(id);
    }
}