import { IMongoloquentSchema, Model } from '@mongoloquent/core';
import { ObjectId } from 'mongodb';
import { Blood } from '../../bloods/entities/blood.model';
import { User } from '../../users/entities/user.model';
import type { GeoPoint } from '../../common/interfaces/geo-point.interface';
export interface IHospital extends IMongoloquentSchema {
  user_id: ObjectId;
  hospital_name: string;
  location: GeoPoint;
  isVerified: boolean;
  code?: string | null;
  address?: string | null;
  unit_donor?: string | null;
  pic_name?: string | null;
  contact?: string | null;
  hospital_type?: string | null;
}

export class Hospital extends Model<IHospital> {
  public static $schema: IHospital;

  public $collection: string = 'hospitals';
  public $useTimestamps: boolean = false;
  public $useSoftDelete: boolean = false;

  public bloods() {
    return this.hasMany(Blood, 'hospitals_id', '_id');
  }

  public user() {
    return this.belongsTo(User, 'user_id', '_id');
  }
}
