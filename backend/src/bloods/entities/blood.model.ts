import { IMongoloquentSchema, Model } from '@mongoloquent/core';
import { ObjectId } from 'mongodb';
import { BloodStatus, BloodType, RhesusType } from '../../common/constants';
import { Hospital } from '../../hospitals/entities/hospital.model';
import { Request } from '../../requests/entities/request.model';

export interface IBlood extends IMongoloquentSchema {
  hospitals_id: ObjectId;
  blood_type: BloodType;
  rhesus: RhesusType;
  quantity: number;
  status_blood: BloodStatus;
  schedule: Date;
  created_at: Date;
}

export class Blood extends Model<IBlood> {
  public static $schema: IBlood;

  public $collection: string = 'bloods';
  public $useTimestamps: boolean = false;
  public $useSoftDelete: boolean = false;

  public hospital() {
    return this.belongsTo(Hospital, 'hospitals_id', '_id');
  }

  public requests() {
    return this.hasMany(Request, 'bloods_id', '_id');
  }
}
