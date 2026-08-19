import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@mongoloquent/nestjs';
import { ObjectId } from 'mongodb';
import { Blood } from '../bloods/entities/blood.model';
import { Request } from '../requests/entities/request.model';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { Hospital } from './entities/hospital.model';

const JAKARTA_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;

function getJakartaDayBounds(now: Date) {
  const jakartaNow = new Date(now.getTime() + JAKARTA_UTC_OFFSET_MS);
  const jakartaMidnightAsUtc = Date.UTC(
    jakartaNow.getUTCFullYear(),
    jakartaNow.getUTCMonth(),
    jakartaNow.getUTCDate(),
  );

  const start = jakartaMidnightAsUtc - JAKARTA_UTC_OFFSET_MS;

  return {
    start,
    end: start + 24 * 60 * 60 * 1000,
  };
}

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

    const today = getJakartaDayBounds(new Date());
    const doneTodayCount = requests.filter((request) => {
      if (request.status !== 'done' || !request.checked_in_at) {
        return false;
      }

      const checkedInAt = new Date(request.checked_in_at).getTime();

      return checkedInAt >= today.start && checkedInAt < today.end;
    }).length;

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
          done_today: doneTodayCount,
        },
      },
    };
  }

  async updateForFacility(
    userId: string,
    updateHospitalDto: UpdateHospitalDto,
  ) {
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

    const metadata = {
      ...(updateHospitalDto.hospital_name !== undefined
        ? { hospital_name: updateHospitalDto.hospital_name.trim() }
        : {}),
      ...(updateHospitalDto.address !== undefined
        ? { address: updateHospitalDto.address?.trim() || null }
        : {}),
      ...(updateHospitalDto.unit_donor !== undefined
        ? { unit_donor: updateHospitalDto.unit_donor?.trim() || null }
        : {}),
      ...(updateHospitalDto.pic_name !== undefined
        ? { pic_name: updateHospitalDto.pic_name?.trim() || null }
        : {}),
      ...(updateHospitalDto.contact !== undefined
        ? { contact: updateHospitalDto.contact?.trim() || null }
        : {}),
      ...(updateHospitalDto.hospital_type !== undefined
        ? { hospital_type: updateHospitalDto.hospital_type?.trim() || null }
        : {}),
    };

    await this.hospitalModel.where('_id', hospital._id).update(metadata);

    return this.getForFacility(userId);
  }
}
