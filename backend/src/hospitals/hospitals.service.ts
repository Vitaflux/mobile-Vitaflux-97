import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@mongoloquent/nestjs';
import { ObjectId } from 'mongodb';
import { Blood } from '../bloods/entities/blood.model';
import { Request } from '../requests/entities/request.model';
import { Hospital } from './entities/hospital.model';

@Injectable()
export class HospitalsService {
  constructor(
    @InjectModel(Hospital)
    private readonly hospitalModel: Hospital,

    @InjectModel(Blood)
    private readonly bloodModel: Blood,

    @InjectModel(Request)
    private readonly requestModel: Request,
  ) {}

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
