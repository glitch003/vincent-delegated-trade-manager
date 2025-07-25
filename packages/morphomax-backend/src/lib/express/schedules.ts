import { Response } from 'express';

import { ScheduleIdentitySchema, ScheduleParamsSchema } from './schema';
import { VincentAuthenticatedRequest } from './types';
import * as jobManager from '../agenda/jobs/morphoMaxJobManager';

const { cancelJob, createJob, disableJob, editJob, enableJob, listJobsByWalletAddress } =
  jobManager;

export const handleListSchedulesRoute = async (req: VincentAuthenticatedRequest, res: Response) => {
  try {
    const {
      pkp: { ethAddress },
    } = req.user.decodedJWT.payload;
    const schedules = await listJobsByWalletAddress({ walletAddress: ethAddress });

    res.json({ data: schedules.map((sched) => sched.toJson()), success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const handleCreateScheduleRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
) => {
  try {
    const {
      pkp: { ethAddress },
    } = req.user.decodedJWT.payload;

    const scheduleParams = ScheduleParamsSchema.parse({
      ...req.body,
      walletAddress: ethAddress,
    });

    const schedule = await createJob(
      { ...scheduleParams },
      { interval: scheduleParams.purchaseIntervalHuman }
    );
    res.status(201).json({ data: schedule.toJson(), success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const handleEditScheduleRoute = async (req: VincentAuthenticatedRequest, res: Response) => {
  try {
    const {
      pkp: { ethAddress },
    } = req.user.decodedJWT.payload;
    const { scheduleId } = ScheduleIdentitySchema.parse(req.params);

    const scheduleParams = ScheduleParamsSchema.parse({
      ...req.body,
      walletAddress: ethAddress,
    });

    const job = await editJob({
      scheduleId,
      data: { ...scheduleParams },
    });
    res.status(201).json({ data: job.toJson(), success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const handleDisableScheduleRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
) => {
  try {
    const {
      pkp: { ethAddress },
    } = req.user.decodedJWT.payload;
    const { scheduleId } = ScheduleIdentitySchema.parse(req.params);

    const job = await disableJob({ scheduleId, walletAddress: ethAddress });
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    res.json({ data: job.toJson(), success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const handleEnableScheduleRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
) => {
  try {
    const {
      pkp: { ethAddress },
    } = req.user.decodedJWT.payload;
    const { scheduleId } = ScheduleIdentitySchema.parse(req.params);

    const job = await enableJob({ scheduleId, walletAddress: ethAddress });

    res.json({ data: job.toJson(), success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const handleDeleteScheduleRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
) => {
  try {
    const {
      pkp: { ethAddress },
    } = req.user.decodedJWT.payload;
    const { scheduleId } = ScheduleIdentitySchema.parse(req.params);

    await cancelJob({ scheduleId, walletAddress: ethAddress });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
