import consola from 'consola';
import { ethers } from 'ethers';
import { Types } from 'mongoose';

import * as optimizeMorphoYieldJobDef from './optimizeMorphoYield';
import { getAgenda } from '../agenda/agendaClient';
import {
  baseProvider,
  getAddressesByChainId,
  getERC20Balance,
  getMorphoPositions,
  redeemMorphoVaults,
  BASE_CHAIN_ID,
} from './optimizeMorphoYield/utils';
import { transferERC20Tokens } from './optimizeMorphoYield/utils/transfer-erc20-tokens';
import { MorphoSwap } from '../mongo/models/MorphoSwap';

interface FindSpecificScheduledJobParams {
  mustExist?: boolean;
  scheduleId: string;
  walletAddress: string;
}

interface CancelJobParams {
  receiverAddress?: string;
  scheduleId: string;
  walletAddress: string;
}

const logger = consola.withTag('optimizeMorphoYieldJobManager');

export async function listJobsByWalletAddress({ walletAddress }: { walletAddress: string }) {
  const agendaClient = getAgenda();
  logger.log('listing jobs', { walletAddress });

  return (await agendaClient.jobs({
    'data.walletAddress': walletAddress,
  })) as optimizeMorphoYieldJobDef.JobType[];
}

export async function findJob(
  params: FindSpecificScheduledJobParams
): Promise<optimizeMorphoYieldJobDef.JobType>;
export async function findJob(
  params: FindSpecificScheduledJobParams
): Promise<optimizeMorphoYieldJobDef.JobType | undefined>;
export async function findJob({
  mustExist,
  scheduleId,
  walletAddress,
}: FindSpecificScheduledJobParams): Promise<optimizeMorphoYieldJobDef.JobType | undefined> {
  const agendaClient = getAgenda();

  const jobs = (await agendaClient.jobs({
    _id: new Types.ObjectId(scheduleId),
    'data.walletAddress': walletAddress,
  })) as optimizeMorphoYieldJobDef.JobType[];

  logger.log(`Found ${jobs.length} jobs with ID ${scheduleId}`);
  if (mustExist && !jobs.length) {
    throw new Error(`No MorphoMax schedule found with ID ${scheduleId}`);
  }

  return jobs[0];
}

export async function disableJob({
  scheduleId,
  walletAddress,
}: Omit<FindSpecificScheduledJobParams, 'mustExist'>) {
  // Idempotent; if a job we're trying to disable doesn't exist, it is disabled.
  const job = await findJob({ scheduleId, walletAddress, mustExist: false });

  if (!job) return null;

  logger.log(`Disabling MorphoMax job ${scheduleId}`);
  job.disable();
  job.attrs.data.updatedAt = new Date();
  return job.save();
}

export async function enableJob({
  scheduleId,
  walletAddress,
}: Omit<FindSpecificScheduledJobParams, 'mustExist'>) {
  const job = await findJob({ scheduleId, walletAddress, mustExist: true });

  logger.log(`Enabling MorphoMax job ${scheduleId}`);
  job.attrs.data.updatedAt = new Date();
  job.enable();
  return job.save();
}

export async function cancelJob({ receiverAddress, scheduleId, walletAddress }: CancelJobParams) {
  const agendaClient = getAgenda();
  logger.log(`Cancelling (deleting) MorphoMax job ${scheduleId}`);
  const scheduleObjectId = new Types.ObjectId(scheduleId);
  const calledJob = await agendaClient.cancel({
    _id: scheduleObjectId,
    'data.walletAddress': walletAddress,
  });

  if (calledJob) {
    const userPositions = await getMorphoPositions({ walletAddress, chainId: BASE_CHAIN_ID });
    const userVaultPositions = userPositions?.user.vaultPositions;
    const redeems = userVaultPositions?.length
      ? await redeemMorphoVaults({
          userVaultPositions,
          walletAddress,
          provider: baseProvider,
        })
      : [];
    const { USDC_ADDRESS } = getAddressesByChainId(baseProvider.network.chainId);
    const tokenBalance = await getERC20Balance({
      walletAddress,
      provider: baseProvider,
      tokenAddress: USDC_ADDRESS,
    });
    const transfers = await transferERC20Tokens({
      receiverAddress,
      walletAddress,
      amount: ethers.utils.formatUnits(tokenBalance.balance, tokenBalance.decimals),
      provider: baseProvider,
      tokenAddress: tokenBalance.address,
    });

    const morphoSwap = new MorphoSwap({
      redeems,
      scheduleId,
      transfers,
      userPositions,
      walletAddress,
      deposits: [],
      success: true,
      userTokenBalance: tokenBalance,
    });
    await morphoSwap.save();
  }

  return calledJob;
}

export async function createJob(
  data: Omit<optimizeMorphoYieldJobDef.JobParams, 'updatedAt'>,
  options: {
    interval?: string;
    schedule?: string;
  } = {}
) {
  const agenda = getAgenda();

  // Create a new job instance
  const job = agenda.create<optimizeMorphoYieldJobDef.JobParams>(
    optimizeMorphoYieldJobDef.jobName,
    {
      ...data,
      updatedAt: new Date(),
    }
  );

  // Currently we only allow a single MorphoMax per walletAddress
  job.unique({ 'data.walletAddress': data.walletAddress });

  // Schedule the job based on provided options
  if (options.interval) {
    // Use 'every' for interval-based scheduling
    logger.log('Setting interval to', options.interval);
    job.repeatEvery(options.interval);
  } else if (options.schedule) {
    // Use 'schedule' for one-time or cron-based scheduling
    job.schedule(options.schedule);
  }

  // Save the job to persist it
  await job.save();
  logger.log(`Created MorphoMax job ${job.attrs._id}`);

  return job;
}
