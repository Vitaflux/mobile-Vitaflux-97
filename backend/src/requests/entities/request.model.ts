import { IMongoloquentSchema, Model } from '@mongoloquent/core';
import { ObjectId } from 'mongodb';
import { Blood } from '../../bloods/entities/blood.model';
import { RequestStatus } from '../../common/constants';
import { UserProfile } from '../../profiles/entities/user-profile.model';

export interface IRequestScreenings {
  screeningPassed: boolean;
  screeningAnswers: Record<string, unknown>;
}

export interface IRequest extends IMongoloquentSchema {
  bloods_id: ObjectId;
  user_Profiles_id: ObjectId;
  screenings: IRequestScreenings;
  status: RequestStatus;
  qr_token: string;
  code: string;
  checked_in_at?: Date | null;
  volume_ml?: number | null;
}

export class Request extends Model<IRequest> {
  public static $schema: IRequest;

  public $collection: string = 'requests';
  public $useTimestamps: boolean = false;
  public $useSoftDelete: boolean = false;

  public blood() {
    return this.belongsTo(Blood, 'bloods_id', '_id');
  }

  public userProfile() {
    return this.belongsTo(UserProfile, 'user_Profiles_id', '_id');
  }
}
