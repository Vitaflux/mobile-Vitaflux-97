import {
  IMongoloquentSchema,
  Model,
} from '@mongoloquent/core';
import { UserProfile } from './user-profile.model';

export interface IUser extends IMongoloquentSchema {
  name: string;
  email: string;
  password: string;
  role: 'donor' | 'facility';
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
}