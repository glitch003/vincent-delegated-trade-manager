import { OrderDirection, VaultOrderBy } from '@morpho-org/blue-api-sdk';
import { Job } from '@whisthub/agenda';
import consola from 'consola';
import { ethers } from 'ethers';

import { type UserVaultPositionItem, type UserPositionItem, type VaultItem } from './morphoLoader';
import {
  baseProvider,
  depositMorphoVault,
  getAddressesByChainId,
  getERC20Balance,
  getMorphoPositions,
  getMorphoVaults,
  redeemMorphoVaults,
  BASE_CHAIN_ID,
} from './utils';
import { env } from '../../env';
import { MorphoSwap } from '../../mongo/models/MorphoSwap';

export type JobType = Job<JobParams>;
export type JobParams = {
  name: string;
  updatedAt: Date;
  walletAddress: string;
};

const { MINIMUM_USDC_BALANCE, MINIMUM_YIELD_IMPROVEMENT_PERCENT } = env;

function getVaultsToOptimize(
  userPositions: UserPositionItem,
  topVault: VaultItem
): UserVaultPositionItem[] {
  // TODO improve this calculation
  // Consider the following stuff:
  // - estimated earning in period
  // - performance and management fees
  // - yield in other tokens
  // - gas cost
  const topVaultAvgNetApy = topVault.state?.avgNetApy || 0;
  const suboptimalVaults = userPositions.user.vaultPositions.filter((vp) => {
    const vaultAvgNetApy = vp.vault.state?.avgNetApy || 0;
    return (
      vp.state?.shares > 0 &&
      topVaultAvgNetApy > vaultAvgNetApy + MINIMUM_YIELD_IMPROVEMENT_PERCENT / 100
    );
  });

  return suboptimalVaults;
}

export async function optimizeMorphoYield(job: JobType): Promise<void> {
  try {
    const {
      _id,
      data: { walletAddress },
    } = job.attrs;

    consola.log('Starting Morpho optimization job...', {
      _id,
      walletAddress,
    });

    consola.debug('Fetching current top USDC vault and user vault positions...');
    const [vaults, userPositions] = await Promise.all([
      getMorphoVaults({
        first: 1,
        orderBy: VaultOrderBy.AvgNetApy,
        orderDirection: OrderDirection.Desc,
        where: {
          assetSymbol_in: ['USDC'],
          chainId_in: [BASE_CHAIN_ID],
          whitelisted: true,
        },
      }),
      getMorphoPositions({ walletAddress, chainId: BASE_CHAIN_ID }),
    ]);
    const topVault = vaults[0];
    if (!topVault) {
      throw new Error('No vault found when looking for top yielding vault');
    }

    consola.debug('Got top USDC vault:', topVault);
    consola.debug('Got user positions:', userPositions);

    let redeems: Awaited<ReturnType<typeof redeemMorphoVaults>> = [];
    if (userPositions) {
      const vaultsToOptimize = getVaultsToOptimize(userPositions, topVault);
      consola.debug('Vaults to optimize:', vaultsToOptimize);

      // Withdraw from vaults to optimize
      redeems = await redeemMorphoVaults({
        walletAddress,
        provider: baseProvider,
        userVaultPositions: vaultsToOptimize,
      });
    }

    // Get user USDC balance
    const { USDC_ADDRESS } = getAddressesByChainId(baseProvider.network.chainId);
    const tokenBalance = await getERC20Balance({
      walletAddress,
      provider: baseProvider,
      tokenAddress: USDC_ADDRESS,
    });
    const { balance, decimals } = tokenBalance;
    consola.debug('User USDC balance:', ethers.utils.formatUnits(balance, decimals));

    const deposits = [];
    if (balance.gt(MINIMUM_USDC_BALANCE * 10 ** decimals)) {
      // Put all USDC into the top vault
      const depositResult = await depositMorphoVault({
        tokenBalance,
        walletAddress,
        provider: baseProvider,
        vault: topVault,
      });
      deposits.push(depositResult);
    }

    consola.log(
      'Job details',
      JSON.stringify(
        {
          deposits,
          redeems,
          topVault,
          userPositions,
          walletAddress,
          userTokenBalances: [tokenBalance],
        },
        null,
        2
      )
    );
    const morphoSwap = new MorphoSwap({
      deposits,
      redeems,
      topVault,
      userPositions,
      walletAddress,
      scheduleId: _id,
      success: true,
      userTokenBalances: [tokenBalance],
    });
    await morphoSwap.save();

    consola.debug(`Successfully optimized Morpho positions for ${walletAddress}`);
  } catch (e) {
    // Catch-and-rethrow is usually an anti-pattern, but Agenda doesn't log failed job reasons to console
    // so this is our chance to log the job failure details using Consola before we throw the error
    // to Agenda, which will write the failure reason to the Agenda job document in Mongo
    const err = e as Error;
    consola.error(err.message, err.stack);
    throw e;
  }
}
