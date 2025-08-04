import { ethers } from 'ethers';

import { alchemyGasSponsor, alchemyGasSponsorApiKey, alchemyGasSponsorPolicyId } from './alchemy';
import { type VaultItem } from '../morphoLoader';
import { BASE_CHAIN_ID, BASE_RPC_URL } from './chain';
import { type TokenBalance } from './get-erc20-info';
import { waitForTransaction } from './wait-for-transaction';
import {
  getErc20ApprovalAbilityClient,
  getMorphoAbilityClient,
  MorphoOperation,
} from '../vincentAbilities';

export async function depositMorphoVault(
  provider: ethers.providers.JsonRpcProvider,
  walletAddress: string,
  vault: VaultItem,
  tokenBalance: TokenBalance
) {
  const erc20ApprovalAbilityClient = getErc20ApprovalAbilityClient();
  const morphoAbilityClient = getMorphoAbilityClient();

  const erc20ApprovalAbilityResponse = await erc20ApprovalAbilityClient.execute(
    {
      chainId: BASE_CHAIN_ID,
      rpcUrl: BASE_RPC_URL,
      spenderAddress: vault.address,
      tokenAddress: tokenBalance.address,
      tokenAmount: tokenBalance.balance.toNumber(),
      tokenDecimals: tokenBalance.decimals,
    },
    {
      delegatorPkpEthAddress: walletAddress,
    }
  );
  const approvalResult = erc20ApprovalAbilityResponse.result;
  if (!('approvedAmount' in approvalResult)) {
    throw new Error(
      `ERC20 approval ability run failed. Response: ${JSON.stringify(approvalResult, null, 2)}`
    );
  }
  if ('approvalTxHash' in approvalResult && typeof approvalResult.approvalTxHash === 'string') {
    await waitForTransaction(provider, approvalResult.approvalTxHash);
  }

  const amountToDeposit = ethers.utils.formatUnits(
    tokenBalance.balance.toString(),
    tokenBalance.decimals
  );
  const morphoDepositAbilityResponse = await morphoAbilityClient.execute(
    {
      alchemyGasSponsor,
      alchemyGasSponsorApiKey,
      alchemyGasSponsorPolicyId,
      amount: amountToDeposit,
      chain: 'base',
      contractAddress: vault.address as string,
      operation: MorphoOperation.VAULT_DEPOSIT,
    },
    {
      delegatorPkpEthAddress: walletAddress,
    }
  );
  const depositResult = morphoDepositAbilityResponse.result;
  if (!('txHash' in depositResult)) {
    throw new Error(
      `Morpho deposit ability run failed. Response: ${JSON.stringify(depositResult, null, 2)}`
    );
  }
  await waitForTransaction(provider, depositResult.txHash);

  return {
    approval: approvalResult,
    deposit: depositResult,
  };
}
