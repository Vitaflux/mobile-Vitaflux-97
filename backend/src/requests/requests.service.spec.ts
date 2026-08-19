import { BadRequestException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { Blood } from '../bloods/entities/blood.model';
import { Hospital } from '../hospitals/entities/hospital.model';
import { UserProfile } from '../profiles/entities/user-profile.model';
import { User } from '../users/entities/user.model';
import { Request } from './entities/request.model';
import { RequestsService } from './requests.service';

describe('RequestsService check-in schedule validation', () => {
  const now = new Date('2026-08-18T08:00:00.000Z');
  const userId = new ObjectId();
  const hospitalId = new ObjectId();
  const bloodId = new ObjectId();
  const requestId = new ObjectId();
  const profileId = new ObjectId();
  const qrToken = '5ae7254f-f2c2-4a3c-8971-f6b7a038fe34';

  function createService(schedule: Date, scheduleEnd: Date | null) {
    const hospital = {
      _id: hospitalId,
      user_id: userId,
    };

    const donorRequest = {
      _id: requestId,
      bloods_id: bloodId,
      user_Profiles_id: profileId,
      screenings: {
        screeningPassed: true,
        screeningAnswers: {},
      },
      status: 'confirmed' as const,
      qr_token: qrToken,
      code: 'VF-8241',
      checked_in_at: null,
      volume_ml: null,
    };

    const blood = {
      _id: bloodId,
      hospitals_id: hospitalId,
      schedule,
      schedule_end: scheduleEnd,
    };

    const update = jest.fn().mockResolvedValue(undefined);

    const requestModel = {
      where: jest.fn((column: string) =>
        column === '_id'
          ? { update }
          : { first: jest.fn().mockResolvedValue(donorRequest) },
      ),
    };

    const bloodModel = {
      where: jest.fn(() => ({
        first: jest.fn().mockResolvedValue(blood),
      })),
    };

    const hospitalModel = {
      where: jest.fn(() => ({
        first: jest.fn().mockResolvedValue(hospital),
      })),
    };

    const profileUpdate = jest.fn().mockResolvedValue(undefined);

    const userProfileModel = {
      where: jest.fn(() => ({
        update: profileUpdate,
      })),
    };

    const service = new RequestsService(
      requestModel as unknown as Request,
      bloodModel as unknown as Blood,
      userProfileModel as unknown as UserProfile,
      hospitalModel as unknown as Hospital,
      {} as User,
    );

    return {
      service,
      update,
      requestModel,
      userProfileModel,
      profileUpdate,
    };
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('rejects check-in before the donation schedule starts', async () => {
    const { service, update } = createService(
      new Date('2026-08-18T09:00:00.000Z'),
      new Date('2026-08-18T15:00:00.000Z'),
    );

    await expect(
      service.checkInForFacility(userId.toString(), qrToken, 350),
    ).rejects.toThrow(
      new BadRequestException(
        'QR cannot be used because the donation schedule has not started',
      ),
    );

    expect(update).not.toHaveBeenCalled();
  });

  it('rejects check-in after the donation schedule ends', async () => {
    const { service, update } = createService(
      new Date('2026-08-18T01:00:00.000Z'),
      new Date('2026-08-18T07:00:00.000Z'),
    );

    await expect(
      service.checkInForFacility(userId.toString(), qrToken, 350),
    ).rejects.toThrow(new BadRequestException('QR/schedule has expired'));

    expect(update).not.toHaveBeenCalled();
  });

  it('completes check-in during the active donation schedule', async () => {
    const { service, update, userProfileModel, profileUpdate } = createService(
      new Date('2026-08-18T07:00:00.000Z'),
      new Date('2026-08-18T09:00:00.000Z'),
    );

    const result = await service.checkInForFacility(
      userId.toString(),
      qrToken,
      350,
    );

    expect(result.data.status).toBe('done');
    expect(result.data.checked_in_at).toEqual(now);
    expect(update).toHaveBeenCalledWith({
      status: 'done',
      checked_in_at: now,
      volume_ml: 350,
    });
    expect(userProfileModel.where).toHaveBeenCalledWith('_id', profileId);
    expect(profileUpdate).toHaveBeenCalledWith({
      last_donor: now,
    });
  });

  it('finds and completes check-in using a manual code', async () => {
    const { service, requestModel } = createService(
      new Date('2026-08-18T07:00:00.000Z'),
      new Date('2026-08-18T09:00:00.000Z'),
    );

    const result = await service.checkInForFacility(
      userId.toString(),
      undefined,
      350,
      'VF-8241',
    );

    expect(requestModel.where).toHaveBeenNthCalledWith(1, 'code', 'VF-8241');
    expect(result.data.status).toBe('done');
  });

  it('rejects check-in without a QR token or manual code', async () => {
    const { service } = createService(
      new Date('2026-08-18T07:00:00.000Z'),
      new Date('2026-08-18T09:00:00.000Z'),
    );

    await expect(service.checkInForFacility(userId.toString())).rejects.toThrow(
      new BadRequestException('QR token or code is required'),
    );
  });

  it('includes the blood component in completed donor history', async () => {
    const donorRequest = {
      _id: requestId,
      bloods_id: bloodId,
      status: 'done' as const,
      qr_token: qrToken,
      code: 'VF-8241',
      checked_in_at: now,
      volume_ml: 350,
    };
    const profile = {
      _id: profileId,
      user_id: userId,
    };
    const blood = {
      _id: bloodId,
      hospitals_id: hospitalId,
      blood_type: 'O',
      rhesus: '+',
      quantity: 10,
      status_blood: 'open',
      schedule: now,
      title: 'Pasien operasi jantung',
      component: 'whole_blood',
    };
    const hospital = {
      _id: hospitalId,
      hospital_name: 'RS Test',
      address: 'Bandung',
      location: {
        type: 'Point',
        coordinates: [107.6191, -6.9175],
      },
    };
    const requestModel = {
      where: jest.fn(() => ({
        where: jest.fn(() => ({
          get: jest.fn().mockResolvedValue([donorRequest]),
        })),
      })),
    };
    const bloodModel = {
      where: jest.fn(() => ({
        first: jest.fn().mockResolvedValue(blood),
      })),
    };
    const userProfileModel = {
      where: jest.fn(() => ({
        first: jest.fn().mockResolvedValue(profile),
      })),
    };
    const hospitalModel = {
      where: jest.fn(() => ({
        first: jest.fn().mockResolvedValue(hospital),
      })),
    };
    const service = new RequestsService(
      requestModel as unknown as Request,
      bloodModel as unknown as Blood,
      userProfileModel as unknown as UserProfile,
      hospitalModel as unknown as Hospital,
      {} as User,
    );

    const result = await service.findMineForDonor(userId.toString(), 'done');

    expect(result.data[0].blood?.component).toBe('whole_blood');
  });
});
