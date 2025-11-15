import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBody, ApiResponse, ApiOperation, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { AddressService } from '../services/address.service';
import { CreateAddressDto } from '../dto/create-address.dto';
import { UpdateAddressDto } from '../dto/update-address.dto';
import { Address } from '../../../shared/schemas/entities/address.entity';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type { Request } from 'express';

@ApiTags('Addresses')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressController {
    constructor(private readonly addressService: AddressService) {}

    @Post()
    @ApiOperation({ summary: 'Create address' })
    @ApiBody({ type: CreateAddressDto })
    @ApiResponse({ status: 201, description: 'Address created', type: Address })
    async create(@Body() createAddressDto: CreateAddressDto, @Req() req: Request) {
        // ensure the address is created for the authenticated user
        (createAddressDto as any).userId = (req as any).user.id;
        return this.addressService.create(createAddressDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all addresses for current user' })
    @ApiResponse({ status: 200, description: 'List of addresses', type: [Address] })
    async findAll(@Req() req: Request) {
        const userId = (req as any).user.id;
        return this.addressService.findByUser(userId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get address by ID (must belong to current user)' })
    @ApiResponse({ status: 200, description: 'Get address by ID', type: Address })
    @ApiParam({ name: 'id', required: true, description: 'ID của địa chỉ' })
    async findOne(@Param('id') id: string, @Req() req: Request) {
        const address = await this.addressService.findOne(id);
        const userId = (req as any).user.id;
        if (address.userId !== userId) throw new ForbiddenException('Access denied');
        return address;
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update address' })
    @ApiBody({ type: UpdateAddressDto })
    @ApiResponse({ status: 200, description: 'Address updated', type: Address })
    @ApiParam({ name: 'id', required: true, description: 'ID của địa chỉ cần cập nhật' })
    async update(@Param('id') id: string, @Body() updateAddressDto: UpdateAddressDto, @Req() req: Request) {
        const address = await this.addressService.findOne(id);
        const userId = (req as any).user.id;
        if (address.userId !== userId) throw new ForbiddenException('Access denied');
        return this.addressService.update(id, updateAddressDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete address' })
    @ApiResponse({ status: 204, description: 'Address deleted' })
    @ApiParam({ name: 'id', required: true, description: 'ID của địa chỉ cần xóa' })
    async remove(@Param('id') id: string, @Req() req: Request) {
        const address = await this.addressService.findOne(id);
        const userId = (req as any).user.id;
        if (address.userId !== userId) throw new ForbiddenException('Access denied');
        return this.addressService.remove(id);
    }
}