/* eslint-disable no-console */

import consola from 'consola';
import { ethers } from 'ethers';

import { getAddressesByChainId } from './get-addresses-by-chain-id';
import { getERC20Contract } from './get-erc20-info';

const estimateGasForApproval = async (
  tokenInContract: ethers.Contract,
  uniswapV3RouterAddress: string,
  amountInSmallestUnit: ethers.BigNumber,
  pkpEthAddress: string
) => {
  // Get current gas data
  const [block, gasPrice, estimatedGas] = await Promise.all([
    tokenInContract.provider.getBlock('latest'),
    tokenInContract.provider.getGasPrice(),
    tokenInContract.estimateGas.approve(uniswapV3RouterAddress, amountInSmallestUnit, {
      from: pkpEthAddress,
    }),
  ]);
  // Add 10% buffer to estimated gas
  const estimatedGasWithBuffer = estimatedGas.mul(110).div(100);

  // Use a more conservative max fee per gas calculation
  const baseFeePerGas = block.baseFeePerGas || gasPrice;
  const maxFeePerGas = baseFeePerGas.mul(150).div(100); // 1.5x base fee
  const maxPriorityFeePerGas = gasPrice.div(10); // 0.1x gas price

  return {
    maxFeePerGas,
    maxPriorityFeePerGas,
    estimatedGas: estimatedGasWithBuffer,
  };
};

export const getEstimatedGasForApproval = async (
  userRpcProvider: ethers.providers.StaticJsonRpcProvider,
  userChainId: string,
  tokenInAddress: string,
  amountIn: string,
  tokenInDecimals: string,
  pkpEthAddress: string
) => {
  const { UNISWAP_V3_ROUTER } = getAddressesByChainId(userChainId);

  const tokenInContract = getERC20Contract(tokenInAddress, userRpcProvider);

  // Convert amountIn to token's smallest unit using input token's decimals
  const amountInSmallestUnit = ethers.utils.parseUnits(amountIn, tokenInDecimals);

  console.log(`Estimating gas for approval transaction...`);
  const { estimatedGas, maxFeePerGas, maxPriorityFeePerGas } = await estimateGasForApproval(
    tokenInContract,
    UNISWAP_V3_ROUTER!,
    amountInSmallestUnit,
    pkpEthAddress
  );

  consola.log('Approval Gas cost details:', {
    estimatedGas: estimatedGas.toString(),
    maxFeePerGas: maxFeePerGas.toString(),
    maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
  });

  return { estimatedGas, maxFeePerGas, maxPriorityFeePerGas };
};
