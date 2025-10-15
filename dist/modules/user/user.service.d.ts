import { Repository } from 'typeorm';
import { User } from '../../shared/schemas/entities/user.entity';
import { Role } from '../../shared/schemas/entities/role.entity';
export declare class UserService {
    private usersRepository;
    private rolesRepository;
    constructor(usersRepository: Repository<User>, rolesRepository: Repository<Role>);
    findOneByEmail(email: string): Promise<User | null>;
    findRoleByName(name: string): Promise<Role | null>;
    create(userData: Partial<User>): Promise<User>;
}
