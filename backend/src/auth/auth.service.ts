import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@mongoloquent/nestjs';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.model';
import type { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User)
    private readonly userModel: User,
  ) {}

  async register(registerDto: RegisterDto) {
    const email = registerDto.email.trim().toLowerCase();

    const existingUser = await this.userModel.where('email', email).first();

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const createdAt = new Date();

    const user = await this.userModel.insert({
      name: registerDto.name.trim(),
      email,
      password: hashedPassword,
      role: registerDto.role,
      created_at: createdAt,
    });

    return {
      success: true,
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
    };
  }
}
