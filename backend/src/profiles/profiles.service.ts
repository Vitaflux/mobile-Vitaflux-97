import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@mongoloquent/nestjs';
import { ObjectId } from 'mongodb';
import { calculateDonorEligibility } from '../common/helpers/donor-eligibility.helper';
import { UpdateDonorProfileDto } from './dto/update-donor-profile.dto';
import { UserProfile } from './entities/user-profile.model';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(UserProfile)
    private readonly userProfileModel: UserProfile,
  ) {}

  async getForDonor(userId: string) {
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

    return {
      success: true,
      data: {
        id: profile._id.toString(),
        user_id: profile.user_id.toString(),
        blood_type: profile.blood_type,
        rhesus: profile.rhesus,
        location: profile.location,
        last_donor: profile.last_donor,
        birth_date: profile.birth_date ?? null,
        weight_kg: profile.weight_kg ?? null,
        city: profile.city ?? null,
        notify_radius_km: profile.notify_radius_km ?? null,
        eligibility: {
          is_eligible: eligibility.isEligible,
          remaining_days: eligibility.remainingDays,
          eligible_at: eligibility.eligibleAt,
        },
      },
    };
  }

  async updateForDonor(
    userId: string,
    updateDonorProfileDto: UpdateDonorProfileDto,
  ) {
    if (!ObjectId.isValid(userId)) {
      throw new UnauthorizedException('Invalid authenticated user');
    }

    const userObjectId = new ObjectId(userId);

    const existingProfile = await this.userProfileModel
      .where('user_id', userObjectId)
      .first();

    const lastDonor = updateDonorProfileDto.last_donor
      ? new Date(updateDonorProfileDto.last_donor)
      : null;

    const birthDate =
      updateDonorProfileDto.birth_date === undefined
        ? undefined
        : updateDonorProfileDto.birth_date
          ? new Date(updateDonorProfileDto.birth_date)
          : null;

    const profileData = {
      blood_type: updateDonorProfileDto.blood_type,
      rhesus: updateDonorProfileDto.rhesus,
      location: {
        type: updateDonorProfileDto.location.type,
        coordinates: updateDonorProfileDto.location.coordinates,
      },
      last_donor: lastDonor,
      ...(birthDate !== undefined ? { birth_date: birthDate } : {}),
      ...(updateDonorProfileDto.weight_kg !== undefined
        ? { weight_kg: updateDonorProfileDto.weight_kg }
        : {}),
      ...(updateDonorProfileDto.city !== undefined
        ? { city: updateDonorProfileDto.city }
        : {}),
      ...(updateDonorProfileDto.notify_radius_km !== undefined
        ? {
            notify_radius_km: updateDonorProfileDto.notify_radius_km,
          }
        : {}),
    };

    let profileId: string;

    if (existingProfile) {
      await this.userProfileModel
        .where('_id', existingProfile._id)
        .update(profileData);

      profileId = existingProfile._id.toString();
    } else {
      const createdProfile = await this.userProfileModel.insert({
        user_id: userObjectId,
        ...profileData,
        push_token: null,
      });

      profileId = createdProfile._id.toString();
    }

    const eligibility = calculateDonorEligibility(lastDonor);

    return {
      success: true,
      data: {
        id: profileId,
        user_id: userId,
        blood_type: profileData.blood_type,
        rhesus: profileData.rhesus,
        location: profileData.location,
        last_donor: profileData.last_donor,
        birth_date:
          birthDate !== undefined
            ? birthDate
            : (existingProfile?.birth_date ?? null),
        weight_kg:
          updateDonorProfileDto.weight_kg !== undefined
            ? updateDonorProfileDto.weight_kg
            : (existingProfile?.weight_kg ?? null),
        city:
          updateDonorProfileDto.city !== undefined
            ? updateDonorProfileDto.city
            : (existingProfile?.city ?? null),
        notify_radius_km:
          updateDonorProfileDto.notify_radius_km !== undefined
            ? updateDonorProfileDto.notify_radius_km
            : (existingProfile?.notify_radius_km ?? null),
        eligibility: {
          is_eligible: eligibility.isEligible,
          remaining_days: eligibility.remainingDays,
          eligible_at: eligibility.eligibleAt,
        },
      },
    };
  }
}
