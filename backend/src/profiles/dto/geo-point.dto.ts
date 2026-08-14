import {
  ArrayMaxSize,
  ArrayMinSize,
  Equals,
  IsArray,
  IsNumber,
} from 'class-validator';

export class GeoPointDto {
  @Equals('Point')
  type!: 'Point';

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  coordinates!: [number, number];
}
