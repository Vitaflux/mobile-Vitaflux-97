import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
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
}
