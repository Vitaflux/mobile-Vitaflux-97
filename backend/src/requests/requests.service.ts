import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@mongoloquent/nestjs';
import { randomUUID } from 'node:crypto';
import { ObjectId } from 'mongodb';
import { Blood } from '../bloods/entities/blood.model';
import { calculateDonorEligibility } from '../common/helpers/donor-eligibility.helper';
import { UserProfile } from '../profiles/entities/user-profile.model';
import { CreateRequestDto } from './dto/create-request.dto';
import { Request } from './entities/request.model';
import { Hospital } from '../hospitals/entities/hospital.model';
import { User } from '../users/entities/user.model';

@Injectable()
export class RequestsService {
  constructor(
    @InjectModel(Request)
    private readonly requestModel: Request,

    @InjectModel(Blood)
    private readonly bloodModel: Blood,

    @InjectModel(UserProfile)
    private readonly userProfileModel: UserProfile,

    @InjectModel(Hospital)
    private readonly hospitalModel: Hospital,

    @InjectModel(User)
    private readonly userModel: User,
  ) {}

  async registerDonor(userId: string, createRequestDto: CreateRequestDto) {
    if (!ObjectId.isValid(userId)) {
      throw new UnauthorizedException('Invalid authenticated user');
    }

    const profile = await this.userProfileModel
      .where('user_id', new ObjectId(userId))
      .first();

    if (!profile) {
      throw new NotFoundException('Donor profile was not found for this user');
    }

    const eligibility = calculateDonorEligibility(profile.last_donor);

    if (!eligibility.isEligible) {
      throw new ConflictException(
        `Donor is not eligible for another ${eligibility.remainingDays} day(s)`,
      );
    }

    const blood = await this.bloodModel
      .where('_id', new ObjectId(createRequestDto.bloods_id))
      .first();

    if (!blood) {
      throw new NotFoundException('Blood request was not found');
    }

    if (blood.status_blood === 'closed') {
      throw new ConflictException('Blood request is already closed');
    }

    if (
      blood.blood_type !== profile.blood_type ||
      blood.rhesus !== profile.rhesus
    ) {
      throw new ConflictException('Blood request does not match donor profile');
    }

    const existingRequest = await this.requestModel
      .where('bloods_id', blood._id)
      .where('user_Profiles_id', profile._id)
      .first();

    if (existingRequest) {
      throw new ConflictException(
        'Donor is already registered for this blood request',
      );
    }

    const request = await this.requestModel.insert({
      bloods_id: blood._id,
      user_Profiles_id: profile._id,
      screenings: {
        screeningPassed: createRequestDto.screenings.screeningPassed,
        screeningAnswers: createRequestDto.screenings.screeningAnswers,
      },
      status: 'registered',
      qr_token: randomUUID(),
    });

    return {
      success: true,
      data: {
        id: request._id.toString(),
        bloods_id: request.bloods_id.toString(),
        user_Profiles_id: request.user_Profiles_id.toString(),
        screenings: request.screenings,
        status: request.status,
        qr_token: request.qr_token,
      },
    };
  }

  async findApplicantsForFacility(userId: string, bloodId: string) {
    if (!ObjectId.isValid(userId)) {
      throw new UnauthorizedException('Invalid authenticated user');
    }

    const hospital = await this.hospitalModel
      .where('user_id', new ObjectId(userId))
      .first();

    if (!hospital) {
      throw new NotFoundException(
        'Hospital profile was not found for this facility',
      );
    }

    const blood = await this.bloodModel
      .where('_id', new ObjectId(bloodId))
      .first();

    if (!blood || !blood.hospitals_id.equals(hospital._id)) {
      throw new NotFoundException('Blood request was not found');
    }

    const requests = await this.requestModel
      .where('bloods_id', blood._id)
      .get();

    const applicants = await Promise.all(
      Array.from(requests).map(async (request) => {
        const profile = await this.userProfileModel
          .where('_id', request.user_Profiles_id)
          .first();

        const user = profile
          ? await this.userModel.where('_id', profile.user_id).first()
          : null;

        return {
          id: request._id.toString(),
          bloods_id: request.bloods_id.toString(),
          user_Profiles_id: request.user_Profiles_id.toString(),
          donor: profile
            ? {
                user_id: profile.user_id.toString(),
                name: user?.name ?? null,
                blood_type: profile.blood_type,
                rhesus: profile.rhesus,
              }
            : null,
          screenings: request.screenings,
          status: request.status,
          qr_token: request.qr_token,
        };
      }),
    );

    return {
      success: true,
      data: applicants,
    };
  }
}
