import { OrderDirection, VaultOrderBy } from '@morpho-org/blue-api-sdk';
import { Job } from '@whisthub/agenda';
import consola from 'consola';
import { ethers } from 'ethers';

import {
  getUsersPositions,
  getVaults,
  type UserVaultPositionItem,
  type UserPositionItem,
  type VaultItem,
} from './morphoLoader';
import { getAddressesByChainId } from './utils';
import { getERC20Contract } from './utils/get-erc20-info';
import { getErc20ApprovalToolClient, getMorphoToolClient } from './vincentTools';
import { env } from '../../../env';
import { MorphoSwap } from '../../../mongo/models/MorphoSwap';

export type JobType = Job<JobParams>;
export type JobParams = {
  name: string;
  purchaseIntervalHuman: string;
  updatedAt: Date;
  walletAddress: string;
};

const { BASE_RPC_URL, MINIMUM_USDC_BALANCE, MINIMUM_YIELD_IMPROVEMENT_PERCENT } = env;

const BASE_CHAIN_ID = 8453;

interface TokenBalance {
  address: string;
  balance: ethers.BigNumber;
  decimals: number;
}

async function waitForTransaction(
  provider: ethers.providers.JsonRpcProvider,
  transactionHash: string,
  confirmations = 4
) {
  const receipt = await provider.waitForTransaction(transactionHash, confirmations);
  if (receipt.status === 1) {
    consola.log('Transaction confirmed:', transactionHash);
  } else {
    consola.error('Transaction failed:', transactionHash);
    throw new Error(`Transaction failed for hash: ${transactionHash}`);
  }
}

async function handleOptimalMorphoVaultDeposit(
  provider: ethers.providers.JsonRpcProvider,
  walletAddress: string,
  topVault: VaultItem,
  tokenBalance: TokenBalance
) {
  const erc20ApprovalToolClient = getErc20ApprovalToolClient();
  const morphoToolClient = getMorphoToolClient();

  const erc20ApprovalToolResponse = await erc20ApprovalToolClient.execute(
    {
      chainId: BASE_CHAIN_ID,
      rpcUrl: BASE_RPC_URL,
      spenderAddress: topVault.address,
      tokenAddress: tokenBalance.address,
      tokenAmount: tokenBalance.balance.toNumber(),
      tokenDecimals: tokenBalance.decimals,
    },
    {
      delegatorPkpEthAddress: walletAddress,
    }
  );
  const approvalResult = erc20ApprovalToolResponse.result;
  if (!('approvedAmount' in approvalResult)) {
    throw new Error(
      `ERC20 approval tool run failed. Response: ${JSON.stringify(approvalResult, null, 2)}`
    );
  }
  if ('approvalTxHash' in approvalResult && typeof approvalResult.approvalTxHash === 'string') {
    await waitForTransaction(provider, approvalResult.approvalTxHash);
  }

  const amountToDeposit = ethers.utils.formatUnits(
    tokenBalance.balance.toString(),
    tokenBalance.decimals
  );
  const morphoDepositToolResponse = await morphoToolClient.execute(
    {
      amount: amountToDeposit,
      chain: 'base',
      operation: 'deposit',
      vaultAddress: topVault.address,
    },
    {
      delegatorPkpEthAddress: walletAddress,
    }
  );
  const depositResult = morphoDepositToolResponse.result;
  if (!('txHash' in depositResult)) {
    throw new Error(
      `Morpho deposit tool run failed. Response: ${JSON.stringify(depositResult, null, 2)}`
    );
  }
  await waitForTransaction(provider, depositResult.txHash);

  return {
    approval: approvalResult,
    deposit: depositResult,
  };
}

async function handleMorphoVaultsRedeem(
  provider: ethers.providers.StaticJsonRpcProvider,
  walletAddress: string,
  userVaultPositions: UserVaultPositionItem[]
) {
  const morphoToolClient = getMorphoToolClient();

  const redeemResults = [];
  /* eslint-disable no-await-in-loop */
  // We have to trigger one redeem per vault and do it in sequence to avoid messing up the nonce
  for (const vaultPosition of userVaultPositions) {
    if (vaultPosition.state?.shares) {
      // Vaults are ERC-4626 compliant so they will always have 18 decimals
      const shares = ethers.utils.formatUnits(vaultPosition.state.shares, 18);
      const morphoWithdrawToolResponse = await morphoToolClient.execute(
        {
          amount: shares,
          chain: provider.network.name,
          operation: 'redeem',
          vaultAddress: vaultPosition.vault.address,
        },
        {
          delegatorPkpEthAddress: walletAddress,
        }
      );
      const redeemResult = morphoWithdrawToolResponse.result as any; // TODO fix in the LA itself
      if (!(redeemResult && 'txHash' in redeemResult && typeof redeemResult.txHash === 'string')) {
        throw new Error(
          `Morpho redeem tool run failed. Response: ${JSON.stringify(redeemResult, null, 2)}`
        );
      }
      await waitForTransaction(provider, redeemResult.txHash);

      redeemResults.push(redeemResult);
    }
  }
  /* eslint-enable no-await-in-loop */

  return {
    redeem: redeemResults,
  };
}

async function getWalletUsdcBalance(
  provider: ethers.providers.StaticJsonRpcProvider,
  walletAddress: string
): Promise<TokenBalance> {
  const { USDC_ADDRESS } = getAddressesByChainId(provider.network.chainId);
  const usdcContract = getERC20Contract(USDC_ADDRESS, provider);

  const [balance, decimals] = await Promise.all([
    usdcContract.balanceOf(walletAddress),
    usdcContract.decimals(),
  ]);

  return {
    balance,
    decimals,
    address: USDC_ADDRESS,
  };
}

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
    return topVaultAvgNetApy < vaultAvgNetApy + MINIMUM_YIELD_IMPROVEMENT_PERCENT / 100;
  });

  return suboptimalVaults;
}

async function getUserVaultPositions(walletAddress: string): Promise<UserPositionItem | undefined> {
  try {
    const usersPositions = await getUsersPositions({
      where: {
        chainId_in: [BASE_CHAIN_ID],
        shares_gte: 1, // Only consider vaults with more than 1 share. This field is an integer so it is basically asking for more than 0
        userAddress_in: [walletAddress],
      },
    });
    const userPositions = usersPositions[0]; // Applying the userAddress_in filter should return only one user

    return userPositions;
  } catch (error) {
    consola.error('Error getting user vault positions:', error);
    consola.warn('Falling back to empty user vault positions');
    return undefined;
  }
}

async function getTopYieldingVault(chainId: number, assetSymbol: string): Promise<VaultItem> {
  const vaults = await getVaults({
    first: 1,
    orderBy: VaultOrderBy.AvgNetApy,
    orderDirection: OrderDirection.Desc,
    where: {
      assetSymbol_in: [assetSymbol],
      chainId_in: [chainId],
      whitelisted: true,
    },
  });

  const topVault = vaults?.[0];
  if (!topVault) {
    throw new Error('No vault found when looking for top yielding vault');
  }

  return topVault;
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

    const provider = new ethers.providers.StaticJsonRpcProvider(BASE_RPC_URL, {
      chainId: BASE_CHAIN_ID,
      name: 'base',
    });

    consola.debug('Fetching current top USDC vault and user vault positions...');
    const [topVault, userPositions] = await Promise.all([
      getTopYieldingVault(BASE_CHAIN_ID, 'USDC'),
      getUserVaultPositions(walletAddress),
    ]);
    consola.debug('Got top USDC vault:', topVault);
    consola.debug('Got user positions:', userPositions);

    const withdrawals = [];
    if (userPositions) {
      const vaultsToOptimize = getVaultsToOptimize(userPositions, topVault);
      consola.debug('Vaults to optimize:', vaultsToOptimize);

      // Withdraw from vaults to optimize
      const withdrawResult = await handleMorphoVaultsRedeem(
        provider,
        walletAddress,
        vaultsToOptimize
      );
      withdrawals.push(withdrawResult);
    }

    // Get user USDC balance
    const tokenBalance = await getWalletUsdcBalance(provider, walletAddress);
    const { balance, decimals } = tokenBalance;
    consola.debug('User USDC balance:', ethers.utils.formatUnits(balance, decimals));

    const deposits = [];
    if (balance.gt(MINIMUM_USDC_BALANCE * 10 ** decimals)) {
      // Put all USDC into the top vault
      const depositResult = await handleOptimalMorphoVaultDeposit(
        provider,
        walletAddress,
        topVault,
        tokenBalance
      );
      deposits.push(depositResult);
    }

    consola.log(
      'Job details',
      JSON.stringify(
        {
          deposits,
          topVault,
          userPositions,
          walletAddress,
          withdrawals,
          userTokenBalance: tokenBalance,
        },
        null,
        2
      )
    );
    const morphoSwap = new MorphoSwap({
      deposits,
      topVault,
      userPositions,
      walletAddress,
      withdrawals,
      scheduleId: _id,
      success: true,
      userTokenBalance: tokenBalance,
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
