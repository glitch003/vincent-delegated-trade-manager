import { ethers } from 'ethers';

import { alchemyGasSponsor, alchemyGasSponsorApiKey, alchemyGasSponsorPolicyId } from './alchemy';
import { type UserVaultPositionItem } from '../morphoLoader';
import { waitForTransaction } from './wait-for-transaction';
import { getMorphoAbilityClient, MorphoOperation } from '../vincentAbilities';

export async function redeemMorphoVaults(
  provider: ethers.providers.StaticJsonRpcProvider,
  walletAddress: string,
  userVaultPositions: UserVaultPositionItem[]
) {
  const morphoAbilityClient = getMorphoAbilityClient();

  const redeemResults = [];
  /* eslint-disable no-await-in-loop */
  // We have to trigger one redeem per vault and do it in sequence to avoid messing up the nonce
  for (const vaultPosition of userVaultPositions) {
    if (vaultPosition.state?.shares) {
      // Vaults are ERC-4626 compliant so they will always have 18 decimals
      const shares = ethers.utils.formatUnits(vaultPosition.state.shares, 18);
      const morphoWithdrawAbilityResponse = await morphoAbilityClient.execute(
        {
          alchemyGasSponsor,
          alchemyGasSponsorApiKey,
          alchemyGasSponsorPolicyId,
          amount: shares,
          chain: provider.network.name,
          operation: MorphoOperation.REDEEM,
          vaultAddress: vaultPosition.vault.address,
        },
        {
          delegatorPkpEthAddress: walletAddress,
        }
      );
      const redeemResult = morphoWithdrawAbilityResponse.result;
      if (!(redeemResult && 'txHash' in redeemResult && typeof redeemResult.txHash === 'string')) {
        throw new Error(
          `Morpho redeem ability run failed. Response: ${JSON.stringify(redeemResult, null, 2)}`
        );
      }
      await waitForTransaction(provider, redeemResult.txHash);

      redeemResults.push(redeemResult);
    }
  }
  /* eslint-enable no-await-in-loop */

  return redeemResults;
}
