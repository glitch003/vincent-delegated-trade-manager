/* eslint-disable no-console */
import consola from 'consola';
import { ethers } from 'ethers';

import { getAddressesByChainId } from './get-addresses-by-chain-id';
import { getUniswapQuote } from './get-uniswap-quote';

const estimateGasForSwap = async (
  uniswapV3RouterContract: ethers.Contract,
  tokenInAddress: string,
  tokenOutAddress: string,
  uniswapV3PoolFee: number,
  pkpEthAddress: string,
  amountInSmallestUnit: ethers.BigNumber,
  amountOutMin: ethers.BigNumber
) => {
  // Get current gas data
  const [block, gasPrice, estimatedGas] = await Promise.all([
    uniswapV3RouterContract.provider.getBlock('latest'),
    uniswapV3RouterContract.provider.getGasPrice(),
    uniswapV3RouterContract.estimateGas.exactInputSingle(
      [
        tokenInAddress,
        tokenOutAddress,
        uniswapV3PoolFee,
        pkpEthAddress,
        amountInSmallestUnit,
        amountOutMin,
        0,
      ],
      { from: pkpEthAddress }
    ),
  ]);

  // Use a more conservative max fee per gas calculation
  const baseFeePerGas = block.baseFeePerGas || gasPrice;
  const maxFeePerGas = baseFeePerGas.mul(150).div(100); // 1.5x base fee
  const maxPriorityFeePerGas = gasPrice.div(10); // 0.1x gas price

  // Add 10% buffer to estimated gas
  const estimatedGasWithBuffer = estimatedGas.mul(110).div(100);

  return {
    maxFeePerGas,
    maxPriorityFeePerGas,
    estimatedGas: estimatedGasWithBuffer,
  };
};

export const getEstimatedUniswapCosts = async ({
  amountIn,
  pkpEthAddress,
  tokenInAddress,
  tokenInDecimals,
  tokenOutAddress,
  tokenOutDecimals,
  userChainId,
  userRpcProvider,
}: {
  amountIn: string;
  pkpEthAddress: string;
  tokenInAddress: string;
  tokenInDecimals: ethers.BigNumber;
  tokenOutAddress: string;
  tokenOutDecimals: ethers.BigNumber;
  userChainId: string;
  userRpcProvider: ethers.providers.StaticJsonRpcProvider;
}) => {
  const { UNISWAP_V3_ROUTER } = getAddressesByChainId(userChainId);

  console.log('Estimating gas for Swap transaction...');

  // Convert amountIn to token's smallest unit using input token's decimals
  const amountInSmallestUnit = ethers.utils.parseUnits(amountIn, tokenInDecimals);

  consola.log('Amount conversion:', { amountInSmallestUnit });
  const uniswapV3RouterContract = new ethers.Contract(
    UNISWAP_V3_ROUTER!,
    [
      'function exactInputSingle((address,address,uint24,address,uint256,uint256,uint160)) external payable returns (uint256)',
    ],
    userRpcProvider
  );

  console.log('Getting Uniswap quote for swap...');

  const { amountOutMin, bestFee } = await getUniswapQuote(
    userRpcProvider,
    userChainId,
    tokenInAddress,
    tokenOutAddress,
    amountIn,
    tokenInDecimals.toString(),
    tokenOutDecimals.toString()
  );

  consola.log('Estimating gas for swap...', {
    amountInSmallestUnit,
    amountOutMin,
    bestFee,
    pkpEthAddress,
    tokenInAddress,
    tokenOutAddress,
    uniswapV3RouterContract: uniswapV3RouterContract.address,
  });

  const { estimatedGas, maxFeePerGas, maxPriorityFeePerGas } = await estimateGasForSwap(
    uniswapV3RouterContract,
    tokenInAddress,
    tokenOutAddress,
    bestFee,
    pkpEthAddress,
    amountInSmallestUnit,
    amountOutMin
  );

  consola.log('Gas cost details:', {
    gasCost: {
      estimatedGas: estimatedGas.toString(),
      maxFeePerGas: maxFeePerGas.toString(),
      maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
    },
    swapCost: {
      amountOutMin: amountOutMin.toString(),
      bestFee: bestFee.toString(),
    },
  });

  return {
    gasCost: { estimatedGas, maxFeePerGas, maxPriorityFeePerGas },
    swapCost: { amountOutMin, bestFee },
  };
};
