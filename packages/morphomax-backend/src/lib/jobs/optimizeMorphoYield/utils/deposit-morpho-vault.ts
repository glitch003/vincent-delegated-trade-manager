import { ethers } from 'ethers';

import { alchemyGasSponsor, alchemyGasSponsorApiKey, alchemyGasSponsorPolicyId } from './alchemy';
import { type VaultItem } from '../morphoLoader';
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

  const erc20Params = {
    chainId: provider.network.chainId,
    rpcUrl: provider.connection.url,
    spenderAddress: vault.address,
    tokenAddress: tokenBalance.address,
    tokenAmount: tokenBalance.balance.toNumber(),
    tokenDecimals: tokenBalance.decimals,
  };
  const erc20ApprovalPrecheckResponse = await erc20ApprovalAbilityClient.precheck(erc20Params, {
    delegatorPkpEthAddress: walletAddress,
  });
  if ('error' in erc20ApprovalPrecheckResponse) {
    throw new Error(
      `ERC20 approval ability precheck failed. Response: ${JSON.stringify(erc20ApprovalPrecheckResponse, null, 2)}`
    );
  }

  const erc20ApprovalExecutionResponse = await erc20ApprovalAbilityClient.execute(erc20Params, {
    delegatorPkpEthAddress: walletAddress,
  });
  const erc20ApprovalExecutionResult = erc20ApprovalExecutionResponse.result;
  if (!('approvedAmount' in erc20ApprovalExecutionResult)) {
    throw new Error(
      `ERC20 approval ability run failed. Response: ${JSON.stringify(erc20ApprovalExecutionResult, null, 2)}`
    );
  }
  if (
    'approvalTxHash' in erc20ApprovalExecutionResult &&
    typeof erc20ApprovalExecutionResult.approvalTxHash === 'string'
  ) {
    await waitForTransaction(provider, erc20ApprovalExecutionResult.approvalTxHash);
  }

  const amountToDeposit = ethers.utils.formatUnits(
    tokenBalance.balance.toString(),
    tokenBalance.decimals
  );

  const morphoDepositParams = {
    alchemyGasSponsor,
    alchemyGasSponsorApiKey,
    alchemyGasSponsorPolicyId,
    amount: amountToDeposit,
    chain: 'base',
    operation: MorphoOperation.DEPOSIT,
    vaultAddress: vault.address as string,
  };
  const morphoDepositPrecheckResponse = await morphoAbilityClient.precheck(morphoDepositParams, {
    delegatorPkpEthAddress: walletAddress,
  });
  const morphoDepositPrecheckResult = morphoDepositPrecheckResponse.result;
  if (!('amountValid' in morphoDepositPrecheckResult)) {
    throw new Error(
      `Morpho redeem precheck failed. Response: ${JSON.stringify(morphoDepositPrecheckResponse, null, 2)}`
    );
  }

  const morphoDepositExecutionResponse = await morphoAbilityClient.execute(morphoDepositParams, {
    delegatorPkpEthAddress: walletAddress,
  });
  const morphoDepositExecutionResult = morphoDepositExecutionResponse.result;
  if (!('txHash' in morphoDepositExecutionResult)) {
    throw new Error(
      `Morpho deposit ability run failed. Response: ${JSON.stringify(morphoDepositExecutionResult, null, 2)}`
    );
  }
  await waitForTransaction(provider, morphoDepositExecutionResult.txHash);

  return {
    approval: erc20ApprovalExecutionResult,
    deposit: morphoDepositExecutionResult,
  };
}
