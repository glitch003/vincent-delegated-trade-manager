import { z } from 'zod';

import { ScheduleIdentitySchema, ScheduleParamsSchema } from './schema';

export type ScheduleParams = z.infer<typeof ScheduleParamsSchema>;

export type ScheduleIdentity = z.infer<typeof ScheduleIdentitySchema>;
