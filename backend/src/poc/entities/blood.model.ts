import {
  IMongoloquentSchema,
  Model,
} from '@mongoloquent/core';
import { ObjectId } from 'mongodb';
import { Hospital } from './hospital.model';

export interface IBlood extends IMongoloquentSchema {
  hospitals_id: ObjectId;
  blood_type: 'A' | 'B' | 'AB' | 'O';
  rhesus: '+' | '-';
  quantity: number;
  status_blood: 'normal' | 'urgent' | 'closed';
  schedule: Date;
  created_at: Date;
}

export class Blood extends Model<IBlood> {
  public static $schema: IBlood;

  public $collection: string = 'bloods';
  public $useTimestamps: boolean = false;
  public $useSoftDelete: boolean = false;

  public hospital() {
    return this.belongsTo(
      Hospital,
      'hospitals_id',
      '_id',
    );
  }
}