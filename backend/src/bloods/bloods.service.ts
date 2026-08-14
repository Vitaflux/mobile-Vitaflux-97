import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ELIGIBILITY_WINDOW_DAYS } from '../common/constants';
import { UserProfile } from '../profiles/entities/user-profile.model';
import { InjectModel } from '@mongoloquent/nestjs';
import { ObjectId } from 'mongodb';
import { Hospital } from '../hospitals/entities/hospital.model';
import { CreateBloodDto } from './dto/create-blood.dto';
import { Blood } from './entities/blood.model';

@Injectable()
export class BloodsService {
  constructor(
    @InjectModel(Blood)
    private readonly bloodModel: Blood,

    @InjectModel(Hospital)
    private readonly hospitalModel: Hospital,

    @InjectModel(UserProfile)
    private readonly userProfileModel: UserProfile,
  ) {}

  async createForFacility(userId: string, createBloodDto: CreateBloodDto) {
    if (!ObjectId.isValid(userId)) {
      throw new UnauthorizedException('Invalid authenticated user');
    }

    const hospital = await this.hospitalModel
      .where(`user_id`, new ObjectId(userId))
      .first();

    if (!hospital) {
      throw new NotFoundException(
        'Hospital profile was not found for this facility',
      );
    }

    const createdAt = new Date();
    const schedule = new Date(createBloodDto.schedule);

    const blood = await this.bloodModel.insert({
      hospitals_id: hospital._id,
      blood_type: createBloodDto.blood_type,
      rhesus: createBloodDto.rhesus,
      quantity: createBloodDto.quantity,
      status_blood: createBloodDto.status_blood,
      schedule,
      created_at: createdAt,
    });

    return {
      success: true,
      data: {
        id: blood._id.toString(),
        hospitals_id: blood.hospitals_id.toString(),
        blood_type: blood.blood_type,
        rhesus: blood.rhesus,
        quantity: blood.quantity,
        status_blood: blood.status_blood,
        schedule: blood.schedule,
        created_at: blood.created_at,
      },
    };
  }

  async findAllForFacility(userId: string) {
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

    const bloods = await this.bloodModel
      .where('hospitals_id', hospital._id)
      .get();

    return {
      success: true,
      data: bloods.map((blood) => ({
        id: blood._id.toString(),
        hospitals_id: blood.hospitals_id.toString(),
        blood_type: blood.blood_type,
        rhesus: blood.rhesus,
        quantity: blood.quantity,
        status_blood: blood.status_blood,
        schedule: blood.schedule,
        created_at: blood.created_at,
      })),
    };
  }

  async findOneForFacility(userId: string, bloodId: string) {
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

    return {
      success: true,
      data: {
        id: blood._id.toString(),
        hospitals_id: blood.hospitals_id.toString(),
        blood_type: blood.blood_type,
        rhesus: blood.rhesus,
        quantity: blood.quantity,
        status_blood: blood.status_blood,
        schedule: blood.schedule,
        created_at: blood.created_at,
      },
    };
  }

  async closeForFacility(userId: string, bloodId: string) {
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

    if (blood.status_blood === 'closed') {
      throw new ConflictException('Blood request is already closed');
    }

    await this.bloodModel.where('_id', blood._id).update({
      status_blood: 'closed',
    });

    return {
      success: true,
      data: {
        id: blood._id.toString(),
        hospitals_id: blood.hospitals_id.toString(),
        blood_type: blood.blood_type,
        rhesus: blood.rhesus,
        quantity: blood.quantity,
        status_blood: 'closed',
        schedule: blood.schedule,
        created_at: blood.created_at,
      },
    };
  }

  async findMatchesForDonor(userId: string) {
    if (!ObjectId.isValid(userId)) {
      throw new UnauthorizedException('Invalid authenticated user');
    }

    const profile = await this.userProfileModel
      .where('user_id', new ObjectId(userId))
      .first();

    if (!profile) {
      throw new NotFoundException('Donor profile was not found for this user');
    }

    if (profile.last_donor) {
      const eligibleAt = new Date(profile.last_donor.getTime());

      eligibleAt.setUTCDate(eligibleAt.getUTCDate() + ELIGIBILITY_WINDOW_DAYS);

      if (eligibleAt > new Date()) {
        return {
          success: true,
          data: [],
        };
      }
    }

    const matchingBloods = await this.bloodModel
      .where('blood_type', profile.blood_type)
      .where('rhesus', profile.rhesus)
      .get();

    return {
      success: true,
      data: matchingBloods
        .filter((blood) => blood.status_blood !== 'closed')
        .map((blood) => ({
          id: blood._id.toString(),
          hospitals_id: blood.hospitals_id.toString(),
          blood_type: blood.blood_type,
          rhesus: blood.rhesus,
          quantity: blood.quantity,
          status_blood: blood.status_blood,
          schedule: blood.schedule,
          created_at: blood.created_at,
        })),
    };
  }
}
