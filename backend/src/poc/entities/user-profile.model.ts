import {
  IMongoloquentSchema,
  Model,
} from '@mongoloquent/core';
import { ObjectId } from 'mongodb';
import { User } from './user.model';

export interface IUserProfile extends IMongoloquentSchema{
    user_id : ObjectId;
    blood_type : 'A' | 'B' | 'AB' | 'O';
    rhesus : '+' | '-';
    latitude : number;
    longitude : number;
    last_donor : Date | null;
    push_token : string | null
}

export class UserProfile extends Model<IUserProfile> {
    public static $schema: IUserProfile;

    public $collection: string = 'userProfiles';
    public $useTimestamps: boolean = false;
    public $useSoftDelete: boolean = false;

    public user() {
        return this.belongsTo(User, 'user_id', '_id');
    }
}