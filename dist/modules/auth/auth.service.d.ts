import { OnApplicationBootstrap } from '@nestjs/common';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../shared/schemas/entities/user.entity';
import { Role } from '../../shared/schemas/entities/role.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService implements OnApplicationBootstrap {
    private userRepo;
    private roleRepo;
    private jwtService;
    private readonly logger;
    constructor(userRepo: Repository<User>, roleRepo: Repository<Role>, jwtService: JwtService);
    onApplicationBootstrap(): Promise<void>;
    register(dto: RegisterUserDto): Promise<{
        message: string;
        user: User;
    }>;
    login(dto: LoginDto): Promise<{
        access_token: string;
        user: {
            name: string;
            email: string;
            roles: Role[];
            id: string;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
}
