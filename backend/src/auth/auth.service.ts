import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@mongoloquent/nestjs';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.model';
import { Hospital } from '../hospitals/entities/hospital.model';
import { UserProfile } from '../profiles/entities/user-profile.model';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User)
    private readonly userModel: User,
    @InjectModel(UserProfile)
    private readonly userProfileModel: UserProfile,
    @InjectModel(Hospital)
    private readonly hospitalModel: Hospital,
    private readonly jwtService: JwtService,
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

    if (registerDto.role === 'donor') {
      await this.userProfileModel.insert({
        user_id: user._id,
        blood_type: registerDto.blood_type!,
        rhesus: registerDto.rhesus!,
        location: registerDto.location,
        last_donor: null,
        push_token: null,
        birth_date: null,
        weight_kg: null,
        city: null,
        notify_radius_km: 10,
      });
    } else {
      await this.hospitalModel.insert({
        user_id: user._id,
        hospital_name: registerDto.name.trim(),
        address: registerDto.address!.trim(),
        location: registerDto.location,
        isVerified: false,
        code: null,
        unit_donor: registerDto.unit_donor!.trim(),
        pic_name: registerDto.pic_name!.trim(),
        contact: registerDto.contact!.trim(),
        hospital_type: registerDto.hospital_type!.trim(),
      });
    }

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

  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();

    const user = await this.userModel.where('email', email).first();

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return {
      success: true,
      data: {
        access_token: accessToken,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    };
  }
}
