import { Module } from '@nestjs/common';
import { MongoloquentModule } from '@mongoloquent/nestjs';
import { Blood } from './entities/blood.model';
import { Hospital } from './entities/hospital.model';
import { UserProfile } from './entities/user-profile.model';
import { User } from './entities/user.model';
import { PocService } from './poc.service';

@Module({
    imports :[
        MongoloquentModule.forFeature([
            User,
            UserProfile,
            Hospital,
            Blood,
        ]),
    ],
    providers : [PocService],
    exports : [PocService],
})

export class PocModule {}