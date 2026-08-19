jest.mock('../notifications/notifications.service', () => ({
  NotificationsService: class NotificationsService {},
}));

import { ObjectId } from 'mongodb';
import { Hospital } from '../hospitals/entities/hospital.model';
import { NotificationsService } from '../notifications/notifications.service';
import { UserProfile } from '../profiles/entities/user-profile.model';
import { Request } from '../requests/entities/request.model';
import { BloodsService } from './bloods.service';
import { Blood } from './entities/blood.model';

describe('BloodsService', () => {
  it('adds the existing applicant and collected counts to donor matches', async () => {
    const userId = new ObjectId();
    const hospitalId = new ObjectId();
    const openBloodId = new ObjectId();
    const closedBloodId = new ObjectId();
    const location = {
      type: 'Point' as const,
      coordinates: [107.6191, -6.9175] as [number, number],
    };
    const profile = {
      user_id: userId,
      blood_type: 'O',
      rhesus: '+',
      location,
      last_donor: null,
    };
    const hospital = {
      _id: hospitalId,
      hospital_name: 'RS Vitaflux',
      address: 'Bandung',
      location,
    };
    const openBlood = {
      _id: openBloodId,
      hospitals_id: hospitalId,
      blood_type: 'O',
      rhesus: '+',
      quantity: 10,
      status_blood: 'urgent',
      schedule: new Date('2026-08-20T09:00:00.000Z'),
      created_at: new Date('2026-08-19T09:00:00.000Z'),
    };
    const closedBlood = {
      ...openBlood,
      _id: closedBloodId,
      status_blood: 'closed',
    };

    const profileModel = {
      where: jest.fn().mockReturnValue({
        first: jest.fn().mockResolvedValue(profile),
      }),
    };
    const hospitalCollection = {
      find: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([hospital]),
      }),
    };
    const hospitalModel = {
      query: jest.fn().mockReturnValue({
        getMongoDBCollection: jest.fn().mockReturnValue(hospitalCollection),
      }),
    };
    const bloodQuery = {
      where: jest.fn(),
      whereIn: jest.fn(),
      get: jest.fn().mockResolvedValue([openBlood, closedBlood]),
    };
    bloodQuery.where.mockReturnValue(bloodQuery);
    bloodQuery.whereIn.mockReturnValue(bloodQuery);
    const bloodModel = {
      where: jest.fn().mockReturnValue(bloodQuery),
    };
    const requestGet = jest.fn().mockResolvedValue([
      { bloods_id: openBloodId, status: 'registered' },
      { bloods_id: openBloodId, status: 'confirmed' },
      { bloods_id: openBloodId, status: 'done' },
    ]);
    const requestModel = {
      whereIn: jest.fn().mockReturnValue({ get: requestGet }),
    };

    const service = new BloodsService(
      bloodModel as unknown as Blood,
      hospitalModel as unknown as typeof Hospital,
      profileModel as unknown as UserProfile,
      requestModel as unknown as Request,
      {} as NotificationsService,
    );

    const result = await service.findMatchesForDonor(userId.toString(), 10000);

    expect(requestModel.whereIn).toHaveBeenCalledWith('bloods_id', [
      openBloodId,
    ]);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual(
      expect.objectContaining({
        id: openBloodId.toString(),
        applicants_count: 3,
        collected: 2,
      }),
    );
  });
});
