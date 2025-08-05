import { Types } from 'mongoose';
import { z } from 'zod';

export const ScheduleParamsSchema = z.object({
  name: z.string().default('Morphomaxing schedule'),
  walletAddress: z
    .string()
    .refine((val) => /^0x[a-fA-F0-9]{40}$/.test(val), { message: 'Invalid wallet address' }),
});
export const ScheduleIdentitySchema = z.object({
  scheduleId: z
    .string()
    .refine((val) => Types.ObjectId.isValid(val), { message: 'Invalid ObjectId' }),
});
export const ScheduleDeleteSchema = z.object({
  receiverAddress: z
    .union([z.string().regex(/^0x[a-fA-F0-9]{40}$/), z.undefined(), z.null(), z.literal('')])
    .transform((v) => (v === '' ? undefined : v)),
});
