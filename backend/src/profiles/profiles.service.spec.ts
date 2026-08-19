import { ObjectId } from 'mongodb';
import { Request } from '../requests/entities/request.model';
import { User } from '../users/entities/user.model';
import { UserProfile } from './entities/user-profile.model';
import { ProfilesService } from './profiles.service';

describe('ProfilesService', () => {
  it('preserves last_donor when a profile update omits the field', async () => {
    const userId = new ObjectId();
    const profileId = new ObjectId();
    const lastDonor = new Date('2026-08-19T09:30:00.000Z');
    const profile = {
      _id: profileId,
      user_id: userId,
      blood_type: 'O',
      rhesus: '+',
      location: {
        type: 'Point' as const,
        coordinates: [107.6191, -6.9175] as [number, number],
      },
      last_donor: lastDonor,
      push_token: null,
    };
    const update = jest.fn((metadata: Record<string, unknown>) =>
      Promise.resolve(metadata),
    );
    const userProfileModel = {
      where: jest.fn((column: string) =>
        column === 'user_id'
          ? { first: jest.fn().mockResolvedValue(profile) }
          : { update },
      ),
    };
    const service = new ProfilesService(
      userProfileModel as unknown as UserProfile,
      {} as Request,
      {} as User,
    );

    const result = await service.updateForDonor(userId.toString(), {
      blood_type: 'O',
      rhesus: '+',
      location: profile.location,
      city: 'Bandung',
    });

    expect(update.mock.calls[0][0]).not.toHaveProperty('last_donor');
    expect(result.data.last_donor).toEqual(lastDonor);
    expect(result.data.eligibility.eligible_at).not.toBeNull();
  });
});
