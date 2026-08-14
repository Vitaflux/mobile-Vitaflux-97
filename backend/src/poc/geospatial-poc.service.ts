import { Injectable } from '@nestjs/common';
import { InjectModel } from '@mongoloquent/nestjs';
import { ObjectId } from 'mongodb';
import type { GeoPoint } from '../common/interfaces/geo-point.interface';
import { Hospital } from '../hospitals/entities/hospital.model';
import { UserProfile } from '../profiles/entities/user-profile.model';

@Injectable()
export class GeospatialPocService {
  constructor(
    @InjectModel(Hospital)
    private readonly hospitalModel: typeof Hospital,
    @InjectModel(UserProfile)
    private readonly userProfileModel: typeof UserProfile,
  ) {}

  async verify() {
    const hospitalCollection = this.hospitalModel
      .query()
      .getMongoDBCollection();

    const userProfileCollection = this.userProfileModel
      .query()
      .getMongoDBCollection();

    const [hospitalIndex, userProfileIndex] = await Promise.all([
      hospitalCollection.createIndex({
        location: '2dsphere',
      }),
      userProfileCollection.createIndex({
        location: '2dsphere',
      }),
    ]);

    const jakartaLocation: GeoPoint = {
      type: 'Point',
      coordinates: [106.8456, -6.2088],
    };

    const temporaryHospital = await hospitalCollection.insertOne({
      user_id: new ObjectId(),
      hospital_name: 'GeoJSON PoC Temporary',
      location: jakartaLocation,
      isVerified: true,
    });

    try {
      const nearbyHospitals = await hospitalCollection
        .find({
          location: {
            $near: {
              $geometry: jakartaLocation,
              $maxDistance: 5000,
            },
          },
        })
        .toArray();

      const temporaryHospitalFound = nearbyHospitals.some((hospital) =>
        hospital._id.equals(temporaryHospital.insertedId),
      );

      return {
        message: 'Geospatial PoC successful',
        indexes: {
          hospitals: hospitalIndex,
          userProfiles: userProfileIndex,
        },
        radiusInMeters: 5000,
        nearbyCount: nearbyHospitals.length,
        temporaryHospitalFound,
      };
    } finally {
      await hospitalCollection.deleteOne({
        _id: temporaryHospital.insertedId,
      });
    }
  }
}
