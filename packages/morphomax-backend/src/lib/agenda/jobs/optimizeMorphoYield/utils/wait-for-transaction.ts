import consola from 'consola';
import { ethers } from 'ethers';

export async function waitForTransaction(
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
