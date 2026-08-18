import { IsIn, IsOptional } from 'class-validator';
import { REQUEST_STATUSES, type RequestStatus } from '../../common/constants';

export class MyRequestsQueryDto {
  @IsOptional()
  @IsIn(REQUEST_STATUSES)
  status?: RequestStatus;
}
