import { IMongoloquentSchema, Model } from '@mongoloquent/core';
import { UserRole } from '../../common/constants';
import { Hospital } from '../../hospitals/entities/hospital.model';
import { UserProfile } from '../../profiles/entities/user-profile.model';

export interface IUser extends IMongoloquentSchema {
  name: string;
  email: string;
  password: string;
  google_sub?: string;
  role: UserRole;
  created_at: Date;
}

export class User extends Model<IUser> {
  public static $schema: IUser;

  public $collection: string = 'users';
  public $useTimestamps: boolean = false;
  public $useSoftDelete: boolean = false;

  public profile() {
    return this.hasOne(UserProfile, 'user_id', '_id');
  }

  public hospital() {
    return this.hasOne(Hospital, 'user_id', '_id');
  }
}
