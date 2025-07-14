import { Types } from 'mongoose';
import { z } from 'zod';

export const ScheduleParamsSchema = z.object({
  name: z.string().default('DCASwap'),
  purchaseAmount: z
    .string()
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(val), {
      message: 'Must be a valid decimal number with up to 2 decimal places (USD currency)',
    })
    .transform((val) => parseFloat(val)),
  purchaseIntervalHuman: z.string(),
  walletAddress: z
    .string()
    .refine((val) => /^0x[a-fA-F0-9]{40}$/.test(val), { message: 'Invalid Ethereum address' }),
});
export const ScheduleIdentitySchema = z.object({
  scheduleId: z
    .string()
    .refine((val) => Types.ObjectId.isValid(val), { message: 'Invalid ObjectId' }),
});
