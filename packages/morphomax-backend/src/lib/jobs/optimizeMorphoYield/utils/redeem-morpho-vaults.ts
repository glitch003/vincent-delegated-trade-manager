import { ethers } from 'ethers';

import { alchemyGasSponsor, alchemyGasSponsorApiKey, alchemyGasSponsorPolicyId } from './alchemy';
import { type UserVaultPositionItem } from '../morphoLoader';
import { waitForTransaction } from './wait-for-transaction';
import { getMorphoAbilityClient, MorphoOperation } from '../vincentAbilities';

export async function redeemMorphoVaults({
  provider,
  userVaultPositions,
  walletAddress,
}: {
  provider: ethers.providers.StaticJsonRpcProvider;
  userVaultPositions: UserVaultPositionItem[];
  walletAddress: string;
}) {
  const morphoAbilityClient = getMorphoAbilityClient();

  const redeemResults = [];
  /* eslint-disable no-await-in-loop */
  // We have to trigger one redeem per vault and do it in sequence to avoid messing up the nonce
  for (const vaultPosition of userVaultPositions) {
    if (vaultPosition.state?.shares) {
      // Vaults are ERC-4626 compliant so they will always have 18 decimals
      const shares = ethers.utils.formatUnits(vaultPosition.state.shares, 18);

      const redeemParams = {
        alchemyGasSponsor,
        alchemyGasSponsorApiKey,
        alchemyGasSponsorPolicyId,
        amount: shares,
        chain: provider.network.name,
        operation: MorphoOperation.REDEEM,
        rpcUrl: provider.connection.url,
        vaultAddress: vaultPosition.vault.address,
      };

      const morphoReedemPrecheckResponse = await morphoAbilityClient.precheck(redeemParams, {
        delegatorPkpEthAddress: walletAddress,
      });
      const morphoRedeemPrecheckResult = morphoReedemPrecheckResponse.result;
      if (!('amountValid' in morphoRedeemPrecheckResult)) {
        throw new Error(
          `Morpho redeem precheck failed. Response: ${JSON.stringify(morphoReedemPrecheckResponse, null, 2)}`
        );
      }

      const morphoReedemExecutionResponse = await morphoAbilityClient.execute(redeemParams, {
        delegatorPkpEthAddress: walletAddress,
      });
      const morphoRedeemExecutionResult = morphoReedemExecutionResponse.result;
      if (
        !(
          morphoRedeemExecutionResult &&
          'txHash' in morphoRedeemExecutionResult &&
          typeof morphoRedeemExecutionResult.txHash === 'string'
        )
      ) {
        throw new Error(
          `Morpho redeem execution failed. Response: ${JSON.stringify(morphoReedemExecutionResponse, null, 2)}`
        );
      }
      await waitForTransaction(provider, morphoRedeemExecutionResult.txHash);

      redeemResults.push(morphoRedeemExecutionResult);
    }
  }
  /* eslint-enable no-await-in-loop */

  return redeemResults;
}
