import { Injectable } from '@nestjs/common';
import { InjectModel } from '@mongoloquent/nestjs';
import { Hospital } from './entities/hospital.model';
import { User } from './entities/user.model';

@Injectable()
export class PocService {
  constructor(
    @InjectModel(User)
    private readonly userModel: User,

    @InjectModel(Hospital)
    private readonly hospitalModel: Hospital,
  ) {}

  async verifyIntegration() {
    const donors = await this.userModel
      .with('profile')
      .where('role', 'donor')
      .get();

    const hospitals = await this.hospitalModel
      .with('bloods')
      .get();

    return {
      message: 'Mongoloquent PoC berhasil',
      donorCount: donors.length,
      hospitalCount: hospitals.length,
      relations: {
        oneToOne: 'users -> userProfiles',
        oneToMany: 'hospitals -> bloods',
      },
    };
  }
}