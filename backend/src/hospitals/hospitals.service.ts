import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@mongoloquent/nestjs';
import { ObjectId } from 'mongodb';
import { Blood } from '../bloods/entities/blood.model';
import { Request } from '../requests/entities/request.model';
import { UserProfile } from '../profiles/entities/user-profile.model';
import { Hospital } from './entities/hospital.model';
import { UpdateHospitalProfileDto } from './dto/update-hospital-profile.dto';

@Injectable()
export class HospitalsService {
  constructor(
    @InjectModel(Hospital)
    private readonly hospitalModel: Hospital,

    @InjectModel(Blood)
    private readonly bloodModel: Blood,

    @InjectModel(Request)
    private readonly requestModel: Request,

    @InjectModel(UserProfile)
    private readonly userProfileModel: UserProfile,
  ) {}

  async findNearbyForDonor(userId: string, radius: number) {
    if (!ObjectId.isValid(userId)) {
      throw new UnauthorizedException('Invalid authenticated user');
    }

    const profile = await this.userProfileModel
      .where('user_id', new ObjectId(userId))
      .first();

    if (!profile) {
      return {
        success: true,
        data: [],
      };
    }

    const nearbyHospitals = await this.hospitalModel
      .where('location', {
        $near: {
          $geometry: profile.location,
          $maxDistance: radius,
        },
      })
      .get();

    const data = await Promise.all(
      Array.from(nearbyHospitals).map(async (hospital) => {
        const bloods = await this.bloodModel
          .where('hospitals_id', hospital._id)
          .get();

        const bloodNeeds = Array.from(bloods)
          .filter((blood) => blood.status_blood !== 'closed')
          .map((blood) => ({
            id: blood._id.toString(),
            blood_type: blood.blood_type,
            rhesus: blood.rhesus,
            quantity: blood.quantity,
            status_blood: blood.status_blood,
            schedule: blood.schedule,
            title: blood.title ?? null,
            note: blood.note ?? null,
            component: blood.component ?? null,
            schedule_end: blood.schedule_end ?? null,
            created_at: blood.created_at,
            is_compatible:
              blood.blood_type === profile.blood_type &&
              blood.rhesus === profile.rhesus,
          }));

        return {
          id: hospital._id.toString(),
          hospital_name: hospital.hospital_name,
          address: hospital.address ?? null,
          location: hospital.location,
          isVerified: hospital.isVerified,
          active_needs_count: bloodNeeds.length,
          blood_needs: bloodNeeds,
        };
      }),
    );

    return {
      success: true,
      data,
    };
  }

  async updateForFacility(
    userId: string,
    updateHospitalProfileDto: UpdateHospitalProfileDto,
  ) {
    if (!ObjectId.isValid(userId)) {
      throw new UnauthorizedException('Invalid authenticated user');
    }

    const userObjectId = new ObjectId(userId);

    const existingHospital = await this.hospitalModel
      .where('user_id', userObjectId)
      .first();

    const hospitalData = {
      hospital_name: updateHospitalProfileDto.hospital_name,
      address: updateHospitalProfileDto.address,
      location: {
        type: updateHospitalProfileDto.location.type,
        coordinates: updateHospitalProfileDto.location.coordinates,
      },
      unit_donor:
        updateHospitalProfileDto.unit_donor !== undefined
          ? updateHospitalProfileDto.unit_donor
          : (existingHospital?.unit_donor ?? null),
      pic_name:
        updateHospitalProfileDto.pic_name !== undefined
          ? updateHospitalProfileDto.pic_name
          : (existingHospital?.pic_name ?? null),
      contact:
        updateHospitalProfileDto.contact !== undefined
          ? updateHospitalProfileDto.contact
          : (existingHospital?.contact ?? null),
      hospital_type:
        updateHospitalProfileDto.hospital_type !== undefined
          ? updateHospitalProfileDto.hospital_type
          : (existingHospital?.hospital_type ?? null),
    };

    if (existingHospital) {
      await this.hospitalModel
        .where('_id', existingHospital._id)
        .update(hospitalData);
    } else {
      await this.hospitalModel.insert({
        user_id: userObjectId,
        ...hospitalData,
        code: null,
        isVerified: false,
      });
    }

    return this.getForFacility(userId);
  }

  async getForFacility(userId: string) {
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

    const requestCollections = await Promise.all(
      Array.from(bloods).map((blood) =>
        this.requestModel.where('bloods_id', blood._id).get(),
      ),
    );

    const requests = requestCollections.flatMap((collection) =>
      Array.from(collection),
    );

    const doneCount = requests.filter(
      (request) => request.status === 'done',
    ).length;

    const confirmedCount = requests.filter(
      (request) => request.status === 'confirmed',
    ).length;

    const attendedOrConfirmed = doneCount + confirmedCount;

    const attendanceRate =
      attendedOrConfirmed === 0
        ? 0
        : Math.round((doneCount / attendedOrConfirmed) * 100);

    return {
      success: true,
      data: {
        id: hospital._id.toString(),
        hospital_name: hospital.hospital_name,
        code: hospital.code ?? null,
        address: hospital.address ?? null,
        unit_donor: hospital.unit_donor ?? null,
        pic_name: hospital.pic_name ?? null,
        contact: hospital.contact ?? null,
        hospital_type: hospital.hospital_type ?? null,
        isVerified: hospital.isVerified,
        location: hospital.location,
        stats: {
          total_collected: doneCount,
          attendance_rate: attendanceRate,
        },
      },
    };
  }
}
