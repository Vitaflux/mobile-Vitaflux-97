import { InjectModel } from '@mongoloquent/nestjs';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { Blood } from '../bloods/entities/blood.model';
import { Hospital } from '../hospitals/entities/hospital.model';
import { UserProfile } from '../profiles/entities/user-profile.model';
import { Request } from '../requests/entities/request.model';
import { User } from '../users/entities/user.model';

const DEMO_PASSWORD = 'Demo12345!';

@Injectable()
export class DemoSeedService {
  constructor(
    @InjectModel(User)
    private readonly userModel: User,

    @InjectModel(UserProfile)
    private readonly userProfileModel: UserProfile,

    @InjectModel(Hospital)
    private readonly hospitalModel: Hospital,

    @InjectModel(Blood)
    private readonly bloodModel: Blood,

    @InjectModel(Request)
    private readonly requestModel: Request,
  ) {}

  async seed() {
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

    let facilityUser = await this.userModel
      .where('email', 'demo.facility@vitaflux.com')
      .first();

    if (facilityUser) {
      await this.userModel.where('_id', facilityUser._id).update({
        name: 'RS Vitaflux Demo',
        password: hashedPassword,
        role: 'facility',
      });
    } else {
      facilityUser = await this.userModel.insert({
        name: 'RS Vitaflux Demo',
        email: 'demo.facility@vitaflux.com',
        password: hashedPassword,
        role: 'facility',
        created_at: new Date(),
      });
    }

    let hospital = await this.hospitalModel
      .where('user_id', facilityUser._id)
      .first();

    const hospitalData = {
      hospital_name: 'RS Vitaflux Demo',
      location: {
        type: 'Point' as const,
        coordinates: [106.8456, -6.2088] as [number, number],
      },
      isVerified: true,
      code: '32.73.011',
      address: 'Jl. Pasteur No. 38, Bandung',
      unit_donor: 'Unit Donor Darah',
      pic_name: 'dr. Siti Rahma',
      contact: '022-1234567',
      hospital_type: 'RS Tipe A',
    };

    if (hospital) {
      await this.hospitalModel.where('_id', hospital._id).update(hospitalData);
    } else {
      hospital = await this.hospitalModel.insert({
        user_id: facilityUser._id,
        ...hospitalData,
      });
    }

    let donorUser = await this.userModel
      .where('email', 'demo.donor@vitaflux.com')
      .first();

    if (donorUser) {
      await this.userModel.where('_id', donorUser._id).update({
        name: 'Donor Vitaflux Demo',
        password: hashedPassword,
        role: 'donor',
      });
    } else {
      donorUser = await this.userModel.insert({
        name: 'Donor Vitaflux Demo',
        email: 'demo.donor@vitaflux.com',
        password: hashedPassword,
        role: 'donor',
        created_at: new Date(),
      });
    }

    let donorProfile = await this.userProfileModel
      .where('user_id', donorUser._id)
      .first();

    const donorProfileData = {
      blood_type: 'O' as const,
      rhesus: '+' as const,
      location: {
        type: 'Point' as const,
        coordinates: [106.846, -6.209] as [number, number],
      },
      last_donor: null,
      push_token: null,
    };

    if (donorProfile) {
      await this.userProfileModel
        .where('_id', donorProfile._id)
        .update(donorProfileData);
    } else {
      donorProfile = await this.userProfileModel.insert({
        user_id: donorUser._id,
        ...donorProfileData,
      });
    }

    let blood = await this.bloodModel
      .where('hospitals_id', hospital._id)
      .first();

    const bloodData = {
      blood_type: 'O' as const,
      rhesus: '+' as const,
      quantity: 5,
      status_blood: 'urgent' as const,
      schedule: new Date('2026-08-20T09:00:00.000Z'),
      title: 'Urgent O+ Blood Donation',
      note: 'Donor should be in good health and bring an identity card.',
      component: 'whole_blood' as const,
      schedule_end: new Date('2026-08-20T15:00:00.000Z'),
      created_at: new Date(),
    };

    if (blood) {
      await this.bloodModel.where('_id', blood._id).update(bloodData);
    } else {
      blood = await this.bloodModel.insert({
        hospitals_id: hospital._id,
        ...bloodData,
      });
    }

    let donorRequest = await this.requestModel
      .where('bloods_id', blood._id)
      .where('user_Profiles_id', donorProfile._id)
      .first();

    const requestData = {
      screenings: {
        screeningPassed: true,
        screeningAnswers: {
          ageEligible: true,
          weightEligible: true,
          notTakingMedication: true,
          healthyCondition: true,
        },
      },
      status: 'registered' as const,
      qr_token: randomUUID(),
      code: 'VF-8241',
      checked_in_at: null,
      volume_ml: null,
    };

    if (donorRequest) {
      await this.requestModel
        .where('_id', donorRequest._id)
        .update(requestData);
    } else {
      donorRequest = await this.requestModel.insert({
        bloods_id: blood._id,
        user_Profiles_id: donorProfile._id,
        ...requestData,
      });
    }

    return {
      message: 'Vitaflux demo data seeded successfully',
      credentials: {
        facility: {
          email: 'demo.facility@vitaflux.com',
          password: DEMO_PASSWORD,
        },
        donor: {
          email: 'demo.donor@vitaflux.com',
          password: DEMO_PASSWORD,
        },
      },
      data: {
        facility_user_id: facilityUser._id.toString(),
        hospital_id: hospital._id.toString(),
        donor_user_id: donorUser._id.toString(),
        donor_profile_id: donorProfile._id.toString(),
        blood_id: blood._id.toString(),
        request_id: donorRequest._id.toString(),
        qr_token: requestData.qr_token,
        code: requestData.code,
        request_status: requestData.status,
      },
    };
  }
}
