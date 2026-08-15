import { InjectModel } from '@mongoloquent/nestjs';
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { calculateDonorEligibility } from '../common/helpers/donor-eligibility.helper';
import { Hospital } from '../hospitals/entities/hospital.model';
import { NotificationsService } from '../notifications/notifications.service';
import { UserProfile } from '../profiles/entities/user-profile.model';
import { CreateBloodDto } from './dto/create-blood.dto';
import { Blood } from './entities/blood.model';

@Injectable()
export class BloodsService implements OnModuleInit {
  private readonly logger = new Logger(BloodsService.name);

  constructor(
    @InjectModel(Blood)
    private readonly bloodModel: Blood,

    @InjectModel(Hospital)
    private readonly hospitalModel: typeof Hospital,

    @InjectModel(UserProfile)
    private readonly userProfileModel: UserProfile,

    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    const hospitalCollection = this.hospitalModel
      .query()
      .getMongoDBCollection();

    await hospitalCollection.createIndex({
      location: '2dsphere',
    });
  }

  async createForFacility(userId: string, createBloodDto: CreateBloodDto) {
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

    if (blood.status_blood === 'urgent') {
      try {
        const pushResult =
          await this.notificationsService.sendUrgentBloodNotification({
            bloodId: blood._id.toString(),
            bloodType: blood.blood_type,
            rhesus: blood.rhesus,
            hospitalName: hospital.hospital_name,
            hospitalLocation: hospital.location,
          });

        this.logger.log(
          `Urgent notification processed for ${pushResult.matched_donors} donor(s)`,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Unknown push notification error';

        this.logger.error(
          `Failed to send urgent blood notification: ${errorMessage}`,
        );
      }
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

  async findMatchesForDonor(userId: string, radius: number) {
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
      return {
        success: true,
        data: [],
      };
    }

    const hospitalCollection = this.hospitalModel
      .query()
      .getMongoDBCollection();

    const nearbyHospitals = await hospitalCollection
      .find({
        location: {
          $near: {
            $geometry: profile.location,
            $maxDistance: radius,
          },
        },
      })
      .toArray();

    if (nearbyHospitals.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    const hospitalIds = nearbyHospitals.map((hospital) => hospital._id);

    const matchingBloods = await this.bloodModel
      .where('blood_type', profile.blood_type)
      .where('rhesus', profile.rhesus)
      .whereIn('hospitals_id', hospitalIds)
      .get();

    const hospitalsById = new Map(
      nearbyHospitals.map(
        (hospital, index) =>
          [
            hospital._id.toString(),
            {
              hospital,
              order: index,
            },
          ] as const,
      ),
    );

    const matches = Array.from(matchingBloods)
      .filter((blood) => blood.status_blood !== 'closed')
      .sort((firstBlood, secondBlood) => {
        const firstOrder =
          hospitalsById.get(firstBlood.hospitals_id.toString())?.order ??
          Number.MAX_SAFE_INTEGER;

        const secondOrder =
          hospitalsById.get(secondBlood.hospitals_id.toString())?.order ??
          Number.MAX_SAFE_INTEGER;

        return firstOrder - secondOrder;
      })
      .map((blood) => {
        const hospitalData = hospitalsById.get(
          blood.hospitals_id.toString(),
        )?.hospital;

        return {
          id: blood._id.toString(),
          hospitals_id: blood.hospitals_id.toString(),
          blood_type: blood.blood_type,
          rhesus: blood.rhesus,
          quantity: blood.quantity,
          status_blood: blood.status_blood,
          schedule: blood.schedule,
          created_at: blood.created_at,
          hospital: hospitalData
            ? {
                id: hospitalData._id.toString(),
                hospital_name: hospitalData.hospital_name,
                location: hospitalData.location,
              }
            : null,
        };
      });

    return {
      success: true,
      data: matches,
    };
  }
}
