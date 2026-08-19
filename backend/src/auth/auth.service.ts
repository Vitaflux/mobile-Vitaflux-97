import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@mongoloquent/nestjs';
import * as bcrypt from 'bcrypt';
import { User, type IUser } from '../users/entities/user.model';
import { Hospital } from '../hospitals/entities/hospital.model';
import { UserProfile } from '../profiles/entities/user-profile.model';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import type { GoogleOnboardingDto } from './dto/google-onboarding.dto';

interface GoogleOnboardingPayload {
  purpose: 'google_onboarding';
  google_sub: string;
  email: string;
  name: string;
}

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
    private readonly configService: ConfigService,
  ) {}

  private createSession(user: IUser) {
    return this.jwtService.signAsync({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    });
  }

  private sessionResponse(user: IUser, accessToken: string) {
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
        unit_donor: null,
        pic_name: null,
        contact: null,
        hospital_type: null,
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

    return this.sessionResponse(user, await this.createSession(user));
  }

  async googleLogin(idToken: string) {
    const googleClientId = this.configService.getOrThrow<string>(
      'GOOGLE_WEB_CLIENT_ID',
    );
    let ticket;
    try {
      ticket = await new OAuth2Client(googleClientId).verifyIdToken({
        idToken,
        audience: googleClientId,
      });
    } catch {
      throw new UnauthorizedException('Invalid Google ID token');
    }
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || !payload.email_verified) {
      throw new UnauthorizedException('Google account could not be verified');
    }

    const email = payload.email.trim().toLowerCase();
    let user = await this.userModel.where('google_sub', payload.sub).first();

    if (!user) {
      user = await this.userModel.where('email', email).first();
      if (user) {
        await this.userModel.where('_id', user._id).update({
          google_sub: payload.sub,
        });
      }
    }

    if (user) {
      return this.sessionResponse(user, await this.createSession(user));
    }

    const onboardingToken = await this.jwtService.signAsync(
      {
        purpose: 'google_onboarding',
        google_sub: payload.sub,
        email,
        name: payload.name?.trim() || email.split('@')[0],
      } satisfies GoogleOnboardingPayload,
      { expiresIn: '15m' },
    );

    return {
      success: true,
      data: {
        requires_onboarding: true,
        onboarding_token: onboardingToken,
        profile: {
          name: payload.name?.trim() || email.split('@')[0],
          email,
        },
      },
    };
  }

  async completeGoogleOnboarding(input: GoogleOnboardingDto) {
    let google: GoogleOnboardingPayload;
    try {
      google = await this.jwtService.verifyAsync<GoogleOnboardingPayload>(
        input.onboarding_token,
      );
    } catch {
      throw new UnauthorizedException('Google onboarding session has expired');
    }

    if (google.purpose !== 'google_onboarding') {
      throw new UnauthorizedException('Invalid Google onboarding session');
    }

    const existingUser = await this.userModel
      .where('email', google.email)
      .first();
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const accountName =
      input.role === 'facility' ? input.name!.trim() : google.name;
    const user = await this.userModel.insert({
      name: accountName,
      email: google.email,
      password: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
      google_sub: google.google_sub,
      role: input.role,
      created_at: new Date(),
    });

    if (input.role === 'donor') {
      await this.userProfileModel.insert({
        user_id: user._id,
        blood_type: input.blood_type!,
        rhesus: input.rhesus!,
        location: input.location,
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
        hospital_name: accountName,
        address: input.address!.trim(),
        location: input.location,
        isVerified: false,
        code: null,
        unit_donor: null,
        pic_name: null,
        contact: null,
        hospital_type: null,
      });
    }

    return this.sessionResponse(user, await this.createSession(user));
  }
}
