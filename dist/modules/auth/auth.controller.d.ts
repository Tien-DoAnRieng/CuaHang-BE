import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterUserDto): Promise<{
        message: string;
        user: import("../../shared/schemas/entities/user.entity").User;
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            name: string;
            email: string;
            roles: import("../../shared/schemas/entities/role.entity").Role[];
            id: string;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
}
