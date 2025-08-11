import { ethers } from 'ethers';

import { alchemyGasSponsor, alchemyGasSponsorApiKey, alchemyGasSponsorPolicyId } from './alchemy';
import { waitForTransaction } from './wait-for-transaction';
import { getErc20TransferAbilityClient } from '../vincentAbilities';

export async function transferERC20Tokens({
  amount,
  provider,
  receiverAddress,
  tokenAddress,
  walletAddress,
}: {
  amount: string;
  provider: ethers.providers.StaticJsonRpcProvider;
  receiverAddress: string;
  tokenAddress: string;
  walletAddress: string;
}) {
  const transferErc20AbilityClient = getErc20TransferAbilityClient();

  const erc20TransferParams = {
    alchemyGasSponsor,
    alchemyGasSponsorApiKey,
    alchemyGasSponsorPolicyId,
    amount,
    tokenAddress,
    chain: provider.network.name,
    rpcUrl: provider.connection.url,
    to: receiverAddress,
  };
  const erc20TransferPrecheckResponse = await transferErc20AbilityClient.precheck(
    erc20TransferParams,
    {
      delegatorPkpEthAddress: walletAddress,
    }
  );
  const erc20TransferPrecheckResult = erc20TransferPrecheckResponse.result;
  if (!('amountValid' in erc20TransferPrecheckResult)) {
    throw new Error(
      `Morpho redeem precheck failed. Response: ${JSON.stringify(erc20TransferPrecheckResponse, null, 2)}`
    );
  }

  const erc20TransferExecutionResponse = await transferErc20AbilityClient.execute(
    erc20TransferParams,
    {
      delegatorPkpEthAddress: walletAddress,
    }
  );
  const erc20TransferExecutionResult = erc20TransferExecutionResponse.result;
  if (
    !(
      erc20TransferExecutionResult &&
      'txHash' in erc20TransferExecutionResult &&
      typeof erc20TransferExecutionResult.txHash === 'string'
    )
  ) {
    throw new Error(
      `Morpho redeem execution failed. Response: ${JSON.stringify(erc20TransferExecutionResponse, null, 2)}`
    );
  }
  await waitForTransaction(provider, morphoRedeemExecutionResult.txHash);

  return {
    transfers: [morphoRedeemExecutionResult],
  };
}
