import {
  IMongoloquentSchema,
  Model,
} from '@mongoloquent/core';
import { ObjectId } from 'mongodb';
import { Blood } from './blood.model';

export interface IHospital extends IMongoloquentSchema {
    user_id : ObjectId;
    hospital_name : string;
    latitude : number;
    longitude : number;
    isVerified : boolean;
}

export class Hospital extends Model<IHospital> {
    public static $schema: IHospital;

    public $collection: string = 'hospitals';
    public $useTimestamps: boolean = false
    public $useSoftDelete: boolean = false

    public bloods() {
        return this.hasMany(Blood, 'hospitals_id', '_id')
    }
}